Port 5050 is still in use. Find and kill the process using it:

**Step 1: Find what's using port 5050**
```bash
# Find the process using port 5050
/usr/bin/lsof -i :5050

# Or using fuser
fuser 5050/tcp

# Or using ss
ss -tlnp | grep :5050
```

**Step 2: Kill the process**
```bash
# If lsof shows PIDs, kill them
# Replace <PID> with the actual PID from lsof output
kill -9 <PID>

# Or use fuser to kill directly
fuser -k 5050/tcp

# Or find and kill in one command
kill -9 $(/usr/bin/lsof -ti :5050)
```

**Step 3: Verify port is free**
```bash
# Check if port is free
netstat -tln | grep 5050
/usr/bin/lsof -i :5050
```

**Step 4: Check if it's a Python process that's still running**
```bash
# Check for Python processes
ps aux | grep python | grep -v grep
ps aux | grep wsgi | grep -v grep
```

**Step 5: Once port is free, start gunicorn again**
```bash
# Make sure you're in the right directory and venv is activated
cd /home/mcrm.hvarstore.com/public_html
source venv/bin/activate

# Start gunicorn
nohup gunicorn --bind 0.0.0.0:5050 wsgi:app > app.log 2>&1 &

# Wait a moment
sleep 2

# Check if it's running
ps aux | grep gunicorn | grep -v grep
netstat -tln | grep 5050

# Test the application
curl http://localhost:5050/health

# Check logs
tail -20 app.log
```

**Alternative: If you can't find the process, try using a different port temporarily**
```bash
# Test with a different port first
nohup gunicorn --bind 0.0.0.0:5051 wsgi:app > app.log 2>&1 &
```

Run `/usr/bin/lsof -i :5050` first to see what's using the port, then kill that process.


Kill the Python processes using port 5050, then restart gunicorn:

**Step 1: Kill the processes**
```bash
# Kill both processes
kill -9 893167 893168

# Verify they're gone
/usr/bin/lsof -i :5050

# Or verify with fuser
fuser 5050/tcp
```

**Step 2: Verify port is free**
```bash
# Check if port is free
netstat -tln | grep 5050

# Should return nothing if port is free
```

**Step 3: Check what those Python processes were**
```bash
# Check if they're still running (they shouldn't be)
ps aux | grep 893167
ps aux | grep 893168

# Check for any remaining Python/wsgi processes
ps aux | grep python | grep -v grep
ps aux | grep wsgi | grep -v grep
```

**Step 4: Start gunicorn**
```bash
# Make sure venv is activated
source venv/bin/activate

# Start gunicorn
nohup gunicorn --bind 0.0.0.0:5050 wsgi:app > app.log 2>&1 &

# Wait a moment
sleep 3

# Check if it's running
ps aux | grep gunicorn | grep -v grep
netstat -tln | grep 5050

# Test the application
curl http://localhost:5050/health

# Check logs
tail -20 app.log
```

**Step 5: Set proper ownership of log file**
```bash
# Set ownership
chown mcrmh4534:nobody app.log 2>/dev/null || true
```

Run `kill -9 893167 893168` first, then verify the port is free before starting gunicorn.

Killing processes 896781 and 897266 using port 5050, then verifying the port is free.


[1 tool called]


Killing processes 896781 and 897266 using port 5050. Use one of these:

**Option 1: Kill all processes using port 5050 (recommended)**
```bash
fuser -k 5050/tcp
```

**Option 2: Kill the specific PIDs**
```bash
kill -9 896781 897266
```

**Option 3: One-liner to find and kill all processes on port 5050**
```bash
kill -9 $(/usr/bin/lsof -ti :5050)
```

After killing, verify the port is free:
```bash
/usr/bin/lsof -i :5050
netstat -tln | grep 5050
```

If nothing returns, the port is free. Then restart gunicorn:
```bash
nohup gunicorn --bind 0.0.0.0:5050 wsgi:app > app.log 2>&1 &
```

Should I update `RUN_WSGI.md` with a simpler one-command solution?


del db

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate all tables (in any order since FK checks are disabled)
TRUNCATE TABLE `tracking_scans`;
TRUNCATE TABLE `service_ticket_history`;
TRUNCATE TABLE `service_items`;
TRUNCATE TABLE `stock_movements`;
TRUNCATE TABLE `service_tickets`;
TRUNCATE TABLE `product_components`;
TRUNCATE TABLE `stock_items`;
TRUNCATE TABLE `customers`;
TRUNCATE TABLE `bosta_orders`;
TRUNCATE TABLE `ticket_sequences`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

cd "F:\Developer\Web\Hvar\Hvar-2025" ; tar --exclude="HUB-MCRM/front" --exclude="HUB-MCRM/.git" --exclude="HUB-MCRM/node_modules" --exclude="HUB-MCRM/__pycache__" --exclude="HUB-MCRM/.pytest_cache" -czf HUB-MCRM-backup.zip HUB-MCRM


--

cd /home/mcrm.hvarstore.com/public_html && pkill -f gunicorn && systemctl stop hvar-hub.service 2>/dev/null || true && fuser -k 5050/tcp 2>/dev/null || true && sleep 2 && echo "Server stopped. Verifying..." && ps aux | grep gunicorn | grep -v grep || echo "✓ No gunicorn processes running"


--

cd /home/mcrm.hvarstore.com/public_html
source venv/bin/activate

nohup gunicorn --bind 0.0.0.0:5050 wsgi:app > app.log 2>&1 &

--

## Single Command to Restart Server

**Stop and Restart in One Command:**
```bash
cd /home/mcrm.hvarstore.com/public_html && pkill -f gunicorn && systemctl stop hvar-hub.service 2>/dev/null || true && fuser -k 5050/tcp 2>/dev/null || true && sleep 2 && source venv/bin/activate && nohup gunicorn --bind 0.0.0.0:5050 wsgi:app > app.log 2>&1 & sleep 2 && echo "✓ Server restarted" && ps aux | grep gunicorn | grep -v grep && echo "✓ Checking port..." && netstat -tln | grep 5050
```

**Or with verification:**
```bash
cd /home/mcrm.hvarstore.com/public_html && pkill -f gunicorn && systemctl stop hvar-hub.service 2>/dev/null || true && fuser -k 5050/tcp 2>/dev/null || true && sleep 2 && echo "Server stopped. Starting..." && source venv/bin/activate && nohup gunicorn --bind 0.0.0.0:5050 wsgi:app > app.log 2>&1 & sleep 3 && echo "✓ Server started. Verifying..." && ps aux | grep gunicorn | grep -v grep && netstat -tln | grep 5050 && echo "✓ Server is running on port 5050"
```

**Simplified version (just restart):**
```bash
cd /home/mcrm.hvarstore.com/public_html && pkill -f gunicorn && fuser -k 5050/tcp 2>/dev/null || true && sleep 2 && source venv/bin/activate && nohup gunicorn --bind 0.0.0.0:5050 wsgi:app > app.log 2>&1 &
```

## Database migrations (production)

The runner is `migrations/run_migrations.py`. It reads MySQL settings from `.env` in the current directory (`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`). It applies numbered `migrations/*.sql` files in order and records them in `migrations_history`.

**Check what is applied vs pending:**
```bash
cd /home/mcrm.hvarstore.com/public_html
source venv/bin/activate
python3 migrations/run_migrations.py status
```

**Apply pending migrations (e.g. `005_add_ticket_source_and_approval.sql` — adds `source`, `approved_by`, `approved_at` on `service_tickets`):**
```bash
cd /home/mcrm.hvarstore.com/public_html
source venv/bin/activate
python3 migrations/run_migrations.py up
```

**If `.env` is elsewhere:**
```bash
python3 migrations/run_migrations.py status --config /path/to/.env
python3 migrations/run_migrations.py up --config /path/to/.env
```

**Recommended deploy order:** stop gunicorn → run `status` / `up` → start gunicorn (short downtime; avoids app hitting mid-migration schema).

```bash
cd /home/mcrm.hvarstore.com/public_html && pkill -f gunicorn && systemctl stop hvar-hub.service 2>/dev/null || true && fuser -k 5050/tcp 2>/dev/null || true && sleep 2 && source venv/bin/activate && python3 migrations/run_migrations.py status && python3 migrations/run_migrations.py up && nohup gunicorn --bind 0.0.0.0:5050 wsgi:app > app.log 2>&1 & sleep 2 && ps aux | grep gunicorn | grep -v grep && netstat -tln | grep 5050
```

--


PARENT="/mnt/pigo-hub/Developer/Web/Hvar/Hvar-2025"
SOURCE="$PARENT/HUB-MCRM"
TEMP="$PARENT/HUB-MCRM-temp"
ZIP="$PARENT/HUB-MCRM-project-$(date +%Y-%m-%d-%H%M%S).zip"
rm -rf "$TEMP" && cp -a "$SOURCE" "$TEMP"
find "$TEMP" -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
rm -rf "$TEMP/front/src" "$TEMP/front/node_modules" "$TEMP/front/public"
rm -f "$TEMP/front/package.json" "$TEMP/front/package-lock.json" "$TEMP/front/vite.config.js" \
  "$TEMP/front/tailwind.config.js" "$TEMP/front/eslint.config.js" "$TEMP/front/postcss.config.js" \
  "$TEMP/front/index.html" "$TEMP/front/.env" "$TEMP/front/.env.production" "$TEMP/front/.htaccess" "$TEMP/front/.gitignore"
rm -rf "$TEMP/.pytest_cache" "$TEMP/.venv" "$TEMP/venv" "$TEMP/.git"
rm -f "$ZIP" && (cd "$TEMP" && zip -rq "$ZIP" .) && rm -rf "$TEMP" && ls -lh "$ZIP"



