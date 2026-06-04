#!/usr/bin/env python3
"""
One-time migration script: Hash plaintext passwords + set admin role + generate JWT_SECRET_KEY

Usage:
    python3 hash_passwords.py              # Run migration
    python3 hash_passwords.py --dry-run    # Preview changes without executing

This script reads DB credentials from /home/mcrm.hvarstore.com/public_html/.env,
hashes all plaintext passwords with bcrypt (rounds=12), sets the admin role for
phone 01033939828, and generates a JWT_SECRET_KEY if missing from .env.
"""

import argparse
import secrets
import sys

try:
    import bcrypt
except ImportError:
    print("ERROR: bcrypt module not found. Install it with:")
    print("  pip install bcrypt")
    sys.exit(1)

try:
    import pymysql
except ImportError:
    print("ERROR: pymysql module not found. Install it with:")
    print("  pip install pymysql")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
ENV_PATH = "/home/mcrm.hvarstore.com/public_html/.env"
ADMIN_PHONE = "01033939828"


def parse_env_file(path: str) -> dict:
    """Parse a .env file into a dict. Skips empty lines and comments."""
    config = {}
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                config[key.strip()] = value.strip()
    return config


def get_db_connection(config: dict):
    """Create and return a pymysql connection from parsed .env config."""
    return pymysql.connect(
        host=config.get("DATABASE_HOST", "localhost"),
        port=int(config.get("DATABASE_PORT", "3306")),
        user=config.get("DATABASE_USER", "root"),
        password=config.get("DATABASE_PASSWORD", ""),
        database=config.get("DATABASE_NAME", "mcrm"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


# ---------------------------------------------------------------------------
# Migration steps
# ---------------------------------------------------------------------------

def step1_hash_plaintext_passwords(conn, dry_run: bool = False) -> int:
    """
    STEP 1 — Hash plaintext passwords.

    Finds all users whose password does NOT start with '$2b$' or '$2a$'
    (i.e. not already bcrypt-hashed) and hashes them.
    Returns the number of passwords migrated.
    """
    print("\n" + "=" * 60)
    print("STEP 1: Hash plaintext passwords")
    print("=" * 60)

    count = 0
    with conn.cursor() as cur:
        cur.execute("SELECT id, phone, password FROM users")
        users = cur.fetchall()

        for user in users:
            uid = user["id"]
            phone = user["phone"]
            password = user["password"]

            # Skip if already hashed (bcrypt hashes start with $2b$ or $2a$)
            if password.startswith("$2b$") or password.startswith("$2a$"):
                print(f"  SKIP: {phone} (id={uid}) — already hashed")
                continue

            if dry_run:
                print(f"  [DRY-RUN] Would hash password for {phone} (id={uid})")
                count += 1
            else:
                hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
                hashed_str = hashed.decode("utf-8")
                cur.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_str, uid))
                print(f"  Hashed password for {phone} (id={uid})")
                count += 1

    if not dry_run:
        conn.commit()

    print(f"\n  >> Migrated {count} passwords from plaintext to bcrypt")
    return count


def step2_set_admin_role(conn, dry_run: bool = False):
    """
    STEP 2 — Set admin role.

    Sets role='admin' for the user with phone 01033939828, then verifies.
    """
    print("\n" + "=" * 60)
    print("STEP 2: Set admin role")
    print("=" * 60)

    with conn.cursor() as cur:
        if dry_run:
            print(f"  [DRY-RUN] Would set role='admin' for phone {ADMIN_PHONE}")
        else:
            cur.execute(
                "UPDATE users SET role = 'admin' WHERE phone = %s",
                (ADMIN_PHONE,),
            )
            conn.commit()
            print(f"  Set admin role for phone {ADMIN_PHONE}")

        # Verify
        cur.execute(
            "SELECT id, phone, name, role FROM users WHERE phone = %s",
            (ADMIN_PHONE,),
        )
        admin_user = cur.fetchone()
        if admin_user:
            print(f"  Verification: id={admin_user['id']}, "
                  f"phone={admin_user['phone']}, "
                  f"name={admin_user['name']}, "
                  f"role={admin_user['role']}")
        else:
            print(f"  WARNING: No user found with phone {ADMIN_PHONE}")


def step3_verify(conn) -> bool:
    """
    STEP 3 — Verify migration results.

    Lists all users with password prefix and role, then checks that
    all passwords are bcrypt-hashed and the admin has role='admin'.
    Returns True if verification passes.
    """
    print("\n" + "=" * 60)
    print("STEP 3: Verify")
    print("=" * 60)

    all_ok = True
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, phone, LEFT(password, 10) AS password_prefix, role FROM users"
        )
        users = cur.fetchall()

        print(f"  {'ID':<5} {'Phone':<15} {'Password Prefix':<15} {'Role':<10}")
        print(f"  {'-'*5} {'-'*15} {'-'*15} {'-'*10}")
        for user in users:
            print(f"  {user['id']:<5} {user['phone']:<15} "
                  f"{user['password_prefix']:<15} {user['role']:<10}")

            # Check password hash
            if not user["password_prefix"].startswith("$2b$") and not user["password_prefix"].startswith("$2a$"):
                print(f"    ⚠ WARNING: Password not hashed for {user['phone']}")
                all_ok = False

            # Check admin role
            if user["phone"] == ADMIN_PHONE and user["role"] != "admin":
                print(f"    ⚠ WARNING: Admin user {ADMIN_PHONE} has role='{user['role']}' instead of 'admin'")
                all_ok = False

    if all_ok:
        print("\n  ✅ All passwords are bcrypt-hashed and admin has correct role.")
    else:
        print("\n  ❌ Verification failed — see warnings above.")

    return all_ok


def step4_generate_jwt_secret(env_path: str, dry_run: bool = False) -> str:
    """
    STEP 4 — Generate JWT_SECRET_KEY.

    Generates a 64-char hex secret. If JWT_SECRET_KEY is not already
    in the .env file, appends it. Returns the secret string.
    """
    print("\n" + "=" * 60)
    print("STEP 4: Generate JWT_SECRET_KEY")
    print("=" * 60)

    secret = secrets.token_hex(32)
    print(f"  Generated JWT_SECRET_KEY: {secret}")

    # Check if it already exists in .env
    try:
        with open(env_path, "r") as f:
            env_content = f.read()
    except FileNotFoundError:
        env_content = ""

    if "JWT_SECRET_KEY" in env_content:
        print("  JWT_SECRET_KEY already exists in .env — skipping append.")
    else:
        if dry_run:
            print(f"  [DRY-RUN] Would append JWT_SECRET_KEY={secret} to {env_path}")
        else:
            with open(env_path, "a") as f:
                f.write(f"\nJWT_SECRET_KEY={secret}\n")
            print(f"  Appended JWT_SECRET_KEY to {env_path}")

    return secret


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="One-time MCRM migration: hash passwords + set admin role")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without executing")
    args = parser.parse_args()

    if args.dry_run:
        print("🔬 DRY-RUN MODE — no changes will be made\n")
    else:
        print("🚀 RUNNING MIGRATION\n")

    try:
        # --- Parse .env ---
        print("Reading database credentials from .env ...")
        config = parse_env_file(ENV_PATH)
        print(f"  Host: {config.get('DATABASE_HOST', 'localhost')}")
        print(f"  DB:   {config.get('DATABASE_NAME', 'mcrm')}")

        # --- Connect ---
        conn = get_db_connection(config)
        print("  Database connection: OK\n")

        # --- Step 1: Hash passwords ---
        hashed_count = step1_hash_plaintext_passwords(conn, dry_run=args.dry_run)

        # --- Step 2: Set admin role ---
        step2_set_admin_role(conn, dry_run=args.dry_run)

        # --- Step 3: Verify ---
        if not args.dry_run:
            ok = step3_verify(conn)
        else:
            print("\n  [DRY-RUN] Skipping verification (no changes made)")

        # --- Step 4: JWT secret ---
        jwt_secret = step4_generate_jwt_secret(ENV_PATH, dry_run=args.dry_run)

        # --- Summary ---
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        if args.dry_run:
            print(f"  Dry-run complete. Would hash {hashed_count} passwords.")
            print(f"  Would set admin role for {ADMIN_PHONE}.")
            print(f"  JWT_SECRET_KEY: {jwt_secret}")
            print(f"  Re-run without --dry-run to apply changes.")
        else:
            print(f"  Passwords hashed: {hashed_count}")
            print(f"  Admin role set for: {ADMIN_PHONE}")
            print(f"  Verification: {'PASSED ✅' if ok else 'FAILED ❌'}")
            print(f"  JWT_SECRET_KEY: {jwt_secret}")
            print(f"\n  Add this to your .env if not already there:")
            print(f"    JWT_SECRET_KEY={jwt_secret}")

        conn.close()

    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
