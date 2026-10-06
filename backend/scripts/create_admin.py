"""Create one admin account from environment variables.

Set ADMIN_EMAIL, ADMIN_PASSWORD, and optionally ADMIN_FULL_NAME.
The password is not printed.
"""

import os
import sys

from app.core.database import SessionLocal
from app.core.roles import RoleCode
from app.repositories.auth import get_user_by_email
from app.services.auth import create_user_with_role, normalize_email


def main() -> int:
    email = os.environ.get("ADMIN_EMAIL", "").strip()
    password = os.environ.get("ADMIN_PASSWORD", "")
    full_name = os.environ.get("ADMIN_FULL_NAME", "Aurexion Admin").strip() or "Aurexion Admin"
    if "@" not in email:
        print("Set ADMIN_EMAIL to the admin email address.", file=sys.stderr)
        return 1
    if len(password) < 8:
        print("Set ADMIN_PASSWORD to at least 8 characters.", file=sys.stderr)
        return 1
    with SessionLocal() as session:
        if get_user_by_email(session, normalize_email(email)) is not None:
            print("An account with that email already exists.")
            return 1
        create_user_with_role(
            session,
            email=email,
            password=password,
            full_name=full_name,
            role=RoleCode.ADMIN,
        )
    print("Admin account created.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
