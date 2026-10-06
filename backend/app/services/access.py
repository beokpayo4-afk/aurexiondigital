from app.core.roles import RoleCode
from app.models.auth import User


def is_staff(user: User | None) -> bool:
    if user is None:
        return False
    allowed = {RoleCode.ADMIN.value, RoleCode.STAFF.value}
    held = {link.role.code for link in user.roles if link.role is not None and link.role.deleted_at is None}
    return not held.isdisjoint(allowed)
