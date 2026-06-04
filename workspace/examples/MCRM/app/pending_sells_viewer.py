# -*- coding: utf-8 -*-
"""Register tools/pending-sells-viewer on the hub app at /pending-sells (port 5050)."""
from __future__ import annotations

import importlib.util
import logging
import sys
from pathlib import Path

logger = logging.getLogger(__name__)


def register_pending_sells(app) -> None:
    project_root = Path(__file__).resolve().parent.parent
    tools_dir = project_root / "tools" / "pending-sells-viewer"
    server_py = tools_dir / "server.py"
    if not server_py.is_file():
        logger.warning("pending_sells_viewer: missing %s", server_py)
        return

    try:
        from dotenv import load_dotenv

        load_dotenv(project_root / ".env")
        load_dotenv(tools_dir / ".env", override=True)
    except ImportError:
        pass

    if str(tools_dir) not in sys.path:
        sys.path.insert(0, str(tools_dir))

    spec = importlib.util.spec_from_file_location("mcrm_pending_sells_viewer", server_py)
    if spec is None or spec.loader is None:
        logger.warning("pending_sells_viewer: could not load %s", server_py)
        return
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    bp = getattr(mod, "pending_sells_bp", None)
    if bp is None:
        logger.warning("pending_sells_viewer: no pending_sells_bp in server.py")
        return

    app.register_blueprint(bp, url_prefix="/pending-sells")
    logger.info("Pending sells viewer registered at /pending-sells/")
