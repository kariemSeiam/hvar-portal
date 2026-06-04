# app/workers/erp_sync_worker.py
"""Background worker for ERP sync to avoid blocking frontend requests."""
import os
import threading
import uuid
import logging
import time
import pymysql
from typing import Dict, Optional
from flask import current_app

logger = logging.getLogger(__name__)

# MySQL named lock visible across all app workers/processes holding the same DB session.
_ERP_CLUSTER_LOCK_NAME = 'hvar_mcrm_erp_sync'

# In-memory job storage (simple, no DB needed for now)
# Format: {job_id: {status, progress, total, created, updated, skipped, deleted, error, started_at, completed_at}}
_sync_jobs: Dict[str, Dict] = {}
_jobs_lock = threading.Lock()

# Active sync tracking - only one sync can run at a time
_active_sync_job_id: Optional[str] = None
_active_sync_lock = threading.Lock()


def is_sync_running() -> bool:
    """Check if a sync is currently running."""
    with _active_sync_lock:
        if _active_sync_job_id is None:
            return False
        job = _sync_jobs.get(_active_sync_job_id)
        if not job:
            return False
        return job.get('status') in ('pending', 'running')


def get_active_sync_job_id() -> Optional[str]:
    """Get the job_id of the currently running sync, if any."""
    with _active_sync_lock:
        if _active_sync_job_id is None:
            return None
        job = _sync_jobs.get(_active_sync_job_id)
        if not job or job.get('status') not in ('pending', 'running'):
            return None
        return _active_sync_job_id


def start_sync_worker(username: str, password: str, start_date: str, end_date: str, force: bool = False) -> Optional[str]:
    """
    Start background ERP sync worker.
    Returns job_id immediately (non-blocking).
    If sync is already running, returns existing job_id unless force=True.
    
    Args:
        username: ERP username
        password: ERP password
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        force: If True, start new sync even if one is running (not recommended)
    
    Returns:
        job_id if started or already running, None if sync is running and force=False
    """
    global _active_sync_job_id
    reconcile_stale_active_sync_job()
    # Check if sync is already running
    with _active_sync_lock:
        if _active_sync_job_id is not None:
            job = _sync_jobs.get(_active_sync_job_id)
            if job and job.get('status') in ('pending', 'running') and not force:
                logger.info(f"Sync already running: {_active_sync_job_id}. Returning existing job_id.")
                return _active_sync_job_id
        
        # Create new job
        job_id = str(uuid.uuid4())
        _active_sync_job_id = job_id
        
        with _jobs_lock:
            _sync_jobs[job_id] = {
                'status': 'pending',
                'progress': 0,
                'total': 0,
                'created': 0,
                'updated': 0,
                'skipped': 0,
                'deleted': 0,
                'error': None,
                'started_at': time.time(),
                'completed_at': None
            }
    
    # Start worker thread
    thread = threading.Thread(
        target=_run_sync_worker,
        args=(job_id, username, password, start_date, end_date),
        daemon=True,
        name=f'erp-sync-{job_id[:8]}'
    )
    thread.start()
    
    logger.info(f"Started ERP sync worker: {job_id}")
    return job_id


def get_job_status(job_id: str) -> Optional[Dict]:
    """Get sync job status by job_id."""
    with _jobs_lock:
        return _sync_jobs.get(job_id)


def _stale_after_seconds() -> float:
    """
    If a job stays pending/running with total=0 and progress=0 longer than this, clear it.
    Env ERP_SYNC_STALE_AFTER_SEC (default 600). Min 120.
    """
    try:
        return max(120.0, float(os.environ.get("ERP_SYNC_STALE_AFTER_SEC", "600")))
    except (TypeError, ValueError):
        return 600.0


def reconcile_stale_active_sync_job() -> None:
    """
    Clear in-memory sync jobs wedged at running/pending with no ERP progress (process crash,
    LB on old build without request timeouts, thread death). Safe to call on every sync-status / start.
    """
    global _active_sync_job_id
    stale_sec = _stale_after_seconds()
    now = time.time()
    with _active_sync_lock:
        jid = _active_sync_job_id
        if jid is None:
            return
        with _jobs_lock:
            job = _sync_jobs.get(jid)
            if not job:
                _active_sync_job_id = None
                return
            status = job.get('status')
            if status not in ('pending', 'running'):
                return
            started = float(job.get('started_at') or 0)
            total = int(job.get('total') or 0)
            progress = int(job.get('progress') or 0)
            if (now - started) <= stale_sec:
                return
            if total != 0 or progress != 0:
                return
            logger.warning(
                "Reconciling stale ERP sync job %s (status=%s, age=%.0fs)",
                jid,
                status,
                now - started,
            )
            _sync_jobs[jid].update({
                'status': 'failed',
                'error': (
                    f"sync_stale_timeout: no progress after {stale_sec:.0f}s — job cleared "
                    "(typical: old app without ERP HTTP timeouts, worker killed, or blocked before totals). "
                    "Redeploy backend and retry."
                ),
                'completed_at': now,
            })
            _active_sync_job_id = None


def is_cluster_erp_sync_busy() -> bool:
    """
    True when any process holds ERP sync GET_LOCK on this DB.
    Requires Flask app context (same as execute_query).

    Uses IS_FREE_LOCK: 1 = lock free, 0 = in use — reliable across replicas sharing MySQL.
    """
    from app.utils.db import execute_query
    try:
        rows = execute_query(
            "SELECT IS_FREE_LOCK(%s) AS fl",
            (_ERP_CLUSTER_LOCK_NAME,),
        )
        if not rows:
            return False
        fl = rows[0].get('fl')
        # NULL (error) → treat as not busy so we don't block sync forever
        if fl is None:
            return False
        return int(fl) == 0
    except Exception as exc:
        logger.warning("ERP cluster busy check failed: %s", exc)
        return False


def _standalone_db_conn():
    """Single dedicated connection for GET_LOCK / RELEASE_LOCK (same session required by MySQL)."""
    cfg = current_app.config
    host = cfg['DATABASE_HOST']
    if host == 'localhost':
        host = '127.0.0.1'
    try:
        rt = int(os.environ.get("ERP_CLUSTER_LOCK_SQL_READ_TIMEOUT", "300"))
    except (TypeError, ValueError):
        rt = 300
    try:
        wt = int(os.environ.get("ERP_CLUSTER_LOCK_SQL_WRITE_TIMEOUT", "300"))
    except (TypeError, ValueError):
        wt = 300
    return pymysql.connect(
        host=host,
        port=int(cfg['DATABASE_PORT']),
        user=cfg['DATABASE_USER'],
        password=cfg['DATABASE_PASSWORD'],
        database=cfg['DATABASE_NAME'],
        charset='utf8mb4',
        autocommit=True,
        connect_timeout=10,
        read_timeout=rt,
        write_timeout=wt,
    )


def _run_sync_worker(job_id: str, username: str, password: str, start_date: str, end_date: str):
    """
    Background worker that performs the actual sync.
    Runs in separate thread, doesn't block request.
    """
    global _active_sync_job_id
    try:
        # Need Flask app context for DB access
        from flask import current_app
        from app import create_app
        
        # Create app instance if not in context
        app = current_app._get_current_object() if current_app else create_app()
        
        with app.app_context():
            # Stay pending until cluster lock + ERP phase; avoids false "running" + total=0 in UI.
            lock_conn = None
            lock_acquired = False
            try:
                lock_conn = _standalone_db_conn()
                cur = lock_conn.cursor()
                try:
                    cur.execute(
                        "SELECT GET_LOCK(%s, 0)",
                        (_ERP_CLUSTER_LOCK_NAME,),
                    )
                    row = cur.fetchone()
                    lock_acquired = bool(row is not None and row[0] == 1)
                finally:
                    cur.close()
            except Exception:
                logger.exception("ERP sync %s: GET_LOCK connection failed", job_id)
                _update_job_status(job_id, {
                    'status': 'failed',
                    'error': 'could not acquire ERP cluster lock (database)',
                    'completed_at': time.time(),
                })
                with _active_sync_lock:
                    if _active_sync_job_id == job_id:
                        _active_sync_job_id = None
                if lock_conn is not None:
                    try:
                        lock_conn.close()
                    except Exception:
                        pass
                return

            if not lock_acquired:
                logger.info(
                    "ERP sync %s skipped: MySQL lock %r held elsewhere",
                    job_id,
                    _ERP_CLUSTER_LOCK_NAME,
                )
                _update_job_status(job_id, {
                    'status': 'completed',
                    'progress': 0,
                    'total': 0,
                    'created': 0,
                    'updated': 0,
                    'skipped': 0,
                    'deleted': 0,
                    'completed_at': time.time(),
                    'note': 'skipped_cluster_lock_busy',
                })
                with _active_sync_lock:
                    if _active_sync_job_id == job_id:
                        _active_sync_job_id = None
                try:
                    lock_conn.close()
                except Exception:
                    pass
                return

            try:
                _update_job_status(job_id, {'status': 'running'})
                # Import here to avoid circular imports
                from app.api.erp_api import ERPAuth, ERP_BASE_URL
                from app.models import order as order_model

                # Import helper functions (they're in call_center_api but safe to import)
                from app.api.call_center_api import (
                    _build_erp_draft_params,
                    _erp_row_to_order,
                    _dedupe_erp_rows_by_order
                )

                # Fetch ERP data (paginate to get all — ERP limit 500 per request)
                erp_auth = ERPAuth(username, password)
                url = f'{ERP_BASE_URL}/sells/draft-dt'
                all_rows = []
                page_size = 500
                start = 0
                while True:
                    params = _build_erp_draft_params(start_date, end_date, start=start, length=page_size)
                    resp = erp_auth.fetch_with_auth(url, params)
                    if resp.status_code != 200:
                        _update_job_status(job_id, {
                            'status': 'failed',
                            'error': f'ERP API returned {resp.status_code}',
                            'completed_at': time.time()
                        })
                        with _active_sync_lock:
                            if _active_sync_job_id == job_id:
                                _active_sync_job_id = None
                        return
                    j = resp.json()
                    page_rows = j.get('data') or j.get('aaData') or []
                    all_rows.extend(page_rows)
                    if len(page_rows) < page_size:
                        break
                    start += page_size
                    logger.info(f"ERP sync: fetched {len(all_rows)} rows so far...")
                rows = _dedupe_erp_rows_by_order(all_rows)

                total = len(rows)
                _update_job_status(job_id, {'total': total})

                # Mark all ERP orders as not in sync
                order_model.mark_erp_orders_not_in_sync()

                created = 0
                updated = 0
                skipped = 0

                # Process rows (NO BOSTA ENRICHMENT - removed for performance)
                for idx, row in enumerate(rows):
                    if isinstance(row, list):
                        row = dict(zip(
                            ['action', 'transaction_date', 'invoice_no', 'contact_name', 'mobile',
                             'whatsapp', 'business_location', 'total_items', 'added_by', 'commission_agent',
                             'shipping_state', 'shipping_city', 'shipping_address', 'shipping_details', 'coupon_code'],
                            row[:15] if len(row) >= 15 else row + [None] * 15
                        ))

                    order_data = _erp_row_to_order(row)
                    if not order_data.get('customer_phone') or not order_data.get('erp_order_id'):
                        skipped += 1
                        continue

                    existing = order_model.get_order_by_erp_order_id(order_data['erp_order_id'])
                    if existing:
                        refresh = {'in_erp': 1}
                        if order_data.get('order_description'):
                            refresh['order_description'] = order_data['order_description']
                        if order_data.get('delivery_address') is not None:
                            refresh['delivery_address'] = order_data['delivery_address']
                        if order_data.get('governorate') is not None:
                            refresh['governorate'] = order_data['governorate']
                        if order_data.get('city') is not None:
                            refresh['city'] = order_data['city']
                        if order_data.get('cod_amount') is not None:
                            refresh['cod_amount'] = order_data['cod_amount']
                        if refresh:
                            try:
                                order_model.update_order(existing['id'], refresh)
                                updated += 1
                            except Exception as upd_e:
                                logger.warning(f"Could not update order {existing['id']}: {upd_e}")
                        skipped += 1
                        continue

                    # NO BOSTA ENRICHMENT - removed for performance
                    # Bosta enrichment happens lazy/on-demand when agent opens order
                    order_data['in_erp'] = 1

                    try:
                        order_model.create_order(order_data)
                        created += 1
                    except pymysql.err.IntegrityError as e:
                        if e.args[0] == 1062:  # MySQL ER_DUP_ENTRY
                            logger.debug(f"Order {order_data.get('erp_order_id')} already exists (duplicate key)")
                        else:
                            logger.warning(f"Integrity constraint violation for order {order_data.get('erp_order_id')}: {e}")
                        skipped += 1
                    except Exception as e:
                        logger.warning(f"Could not create order {order_data.get('erp_order_id')}: {e}")
                        skipped += 1

                    # Update progress every 10 orders
                    if (idx + 1) % 10 == 0:
                        _update_job_status(job_id, {
                            'progress': idx + 1,
                            'created': created,
                            'updated': updated,
                            'skipped': skipped
                        })

                # Delete orders not in ERP
                deleted = order_model.delete_orders_not_in_erp()
                logger.info(f"Deleted {deleted} orders with status='new' and in_erp=0 after sync")

                # Mark complete
                _update_job_status(job_id, {
                    'status': 'completed',
                    'progress': total,
                    'created': created,
                    'updated': updated,
                    'skipped': skipped,
                    'deleted': deleted,
                    'completed_at': time.time()
                })

                # Clear active sync lock
                with _active_sync_lock:
                    if _active_sync_job_id == job_id:
                        _active_sync_job_id = None

            finally:
                if lock_acquired and lock_conn is not None:
                    try:
                        rel = lock_conn.cursor()
                        try:
                            rel.execute(
                                "SELECT RELEASE_LOCK(%s)",
                                (_ERP_CLUSTER_LOCK_NAME,),
                            )
                        finally:
                            rel.close()
                    except Exception as rel_e:
                        logger.warning("ERP sync %s RELEASE_LOCK: %s", job_id, rel_e)
                    try:
                        lock_conn.close()
                    except Exception:
                        pass

    except Exception as e:
        logger.exception(f"ERP sync worker {job_id} failed")
        _update_job_status(job_id, {
            'status': 'failed',
            'error': str(e),
            'completed_at': time.time()
        })
        
        # Clear active sync lock even on failure
        with _active_sync_lock:
            if _active_sync_job_id == job_id:
                _active_sync_job_id = None


def _update_job_status(job_id: str, updates: Dict):
    """Update job status (thread-safe)."""
    with _jobs_lock:
        if job_id in _sync_jobs:
            _sync_jobs[job_id].update(updates)


def start_scheduled_sync(interval_minutes: int = 20):
    """
    Start scheduled sync worker that runs every interval_minutes.
    Call this once when Flask app starts.
    
    Args:
        interval_minutes: Minutes between syncs (default: 20)
    """
    import os
    
    def run_scheduled_sync():
        """Inner function to run sync and schedule next one."""
        try:
            username = os.environ.get('ERP_DEFAULT_USERNAME')
            password = os.environ.get('ERP_DEFAULT_PASSWORD')
            
            if not username or not password:
                logger.warning("Scheduled sync skipped: ERP_DEFAULT_USERNAME/ERP_DEFAULT_PASSWORD not set")
            else:
                logger.info(f"Starting scheduled ERP sync (every {interval_minutes} minutes)")
                start_sync_worker(
                    username=username,
                    password=password,
                    start_date='2026-01-01',
                    end_date='2026-12-31',
                    force=False  # Don't force - skip if sync is already running
                )
        except Exception as e:
            logger.exception(f"Scheduled sync failed: {e}")
        finally:
            # Schedule next sync
            timer = threading.Timer(interval_minutes * 60, run_scheduled_sync)
            timer.daemon = True
            timer.start()
    
    # Start first sync after initial delay (30 seconds to let app fully start)
    timer = threading.Timer(30, run_scheduled_sync)
    timer.daemon = True
    timer.start()
    logger.info(f"Scheduled sync worker initialized: will run every {interval_minutes} minutes")
