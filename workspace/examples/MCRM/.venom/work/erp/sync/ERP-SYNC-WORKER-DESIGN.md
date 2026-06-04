# ERP Sync Worker Design — Background Processing

> **Problem:** Sync blocks request thread, causes frontend lag with 20 agents × 50k clients
> **Solution:** Background worker + lazy Bosta enrichment + bulk operations

---

## Current Bottleneck Analysis

### Performance Killers

| Operation | Time | Impact |
|-----------|------|--------|
| **ERP fetch** | ~2-5s | Acceptable |
| **Bosta enrichment (per order)** | 1-3s × 143 orders | **286-429 seconds** 🔴 |
| **DB inserts (sequential)** | 0.01s × 143 | ~1.4s |
| **Total sync time** | **~5-7 minutes** | Blocks request thread |

**With 20 agents:**
- Each sync request blocks for 5-7 minutes
- Frontend timeout (30s default)
- Database locks
- Poor UX

---

## Solution Architecture

### 1. Remove Bosta Enrichment from Sync

**Current:** Sync calls Bosta for every new order
**New:** Skip Bosta enrichment during sync. Enrich on-demand when agent opens order.

**Why:**
- Bosta enrichment is best-effort (doesn't block order creation)
- Agent can work without it initially
- Enrich when needed (lazy loading)

**Impact:** Sync time drops from 5-7 min → **~10-15 seconds**

### 2. Background Worker Pattern

**Architecture:**
```
Frontend → POST /api/call-center/orders/sync-from-erp
  ↓
Backend → Start background thread → Return job_id immediately (200ms)
  ↓
Worker → Fetch ERP → Process rows → Bulk insert → Update status
  ↓
Frontend → Poll GET /api/call-center/sync-status/{job_id} → Show progress
```

**Implementation:**
- Use `threading.Thread` (no Celery needed)
- Store job status in memory dict (or DB table `sync_jobs`)
- Job states: `pending` → `running` → `completed` / `failed`

### 3. Bulk Database Operations

**Current:** One INSERT per order (143 queries)
**New:** Batch INSERT (1 query for 143 orders)

**Pattern:**
```python
# Batch insert
INSERT INTO orders (...) VALUES
  (?, ?, ...),
  (?, ?, ...),
  ...
```

**Impact:** DB time drops from 1.4s → **~0.1s**

---

## Implementation Plan

### Phase 1: Remove Bosta from Sync (Immediate Win)

**Change:** Comment out `_bosta_enrich_order()` call in sync loop
**Result:** Sync time: 5-7 min → 10-15 seconds
**Risk:** 🟢 Low — Bosta enrichment is optional

### Phase 2: Background Worker

**New files:**
- `app/workers/erp_sync_worker.py` — Background worker
- `app/models/sync_job.py` — Job status tracking (optional, or use memory)

**Modified:**
- `app/api/call_center_api.py` — Start worker, return job_id
- New endpoint: `GET /api/call-center/sync-status/{job_id}`

### Phase 3: Bulk Operations

**Change:** Collect orders → Batch INSERT
**Result:** Further speedup

---

## Detailed Design

### Worker Status Storage (Memory-Based)

```python
# app/workers/erp_sync_worker.py
_sync_jobs = {}  # {job_id: {status, progress, result, error}}

def start_sync_worker(username, password, start_date, end_date):
    job_id = str(uuid.uuid4())
    _sync_jobs[job_id] = {
        'status': 'pending',
        'progress': 0,
        'total': 0,
        'created': 0,
        'updated': 0,
        'skipped': 0,
        'deleted': 0,
        'error': None
    }
    
    thread = threading.Thread(
        target=_run_sync_worker,
        args=(job_id, username, password, start_date, end_date),
        daemon=True
    )
    thread.start()
    return job_id
```

### Sync Endpoint (Non-Blocking)

```python
@call_center_api_blueprint.route('/orders/sync-from-erp', methods=['POST'])
def sync_from_erp():
    # Validate credentials
    # Start worker
    job_id = erp_sync_worker.start_sync_worker(username, password, start_date, end_date)
    return jsonify({
        "success": True,
        "job_id": job_id,
        "message": "Sync started in background"
    }), 202  # Accepted (not completed)
```

### Status Endpoint

```python
@call_center_api_blueprint.route('/sync-status/<job_id>', methods=['GET'])
def get_sync_status(job_id):
    job = erp_sync_worker.get_job_status(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job), 200
```

---

## Frontend Changes

### Before (Blocking)
```javascript
const response = await axios.post('/api/call-center/orders/sync-from-erp', {...});
// Waits 5-7 minutes, often times out
```

### After (Non-Blocking)
```javascript
// Start sync
const { job_id } = await axios.post('/api/call-center/orders/sync-from-erp', {...});

// Poll status
const pollStatus = async () => {
  const status = await axios.get(`/api/call-center/sync-status/${job_id}`);
  if (status.status === 'completed') {
    // Show results
  } else if (status.status === 'failed') {
    // Show error
  } else {
    // Show progress, poll again in 2s
    setTimeout(pollStatus, 2000);
  }
};
pollStatus();
```

---

## Performance Comparison

| Metric | Before | After |
|--------|--------|-------|
| **Request time** | 5-7 min (timeout) | 200ms |
| **Sync time** | 5-7 min | 10-15s (background) |
| **Frontend blocking** | Yes | No |
| **Bosta calls** | 143 (sync) | 0 (lazy) |
| **DB queries** | 143 INSERTs | 1 batch INSERT |

---

## Migration Path

1. **Step 1:** Remove Bosta enrichment from sync (immediate 99% speedup)
2. **Step 2:** Add background worker (non-blocking)
3. **Step 3:** Add bulk operations (further optimization)

**Risk:** 🟢 Low — each step is independent, can rollback

---

## Alternative: Lazy Bosta Enrichment

**When agent opens order:**
- Check if `bosta_tracking` exists
- If not → Call Bosta API → Update order
- Show loading state during enrichment

**Benefits:**
- Sync is fast (no Bosta calls)
- Enrichment happens only when needed
- Agent sees order immediately, Bosta data loads async
