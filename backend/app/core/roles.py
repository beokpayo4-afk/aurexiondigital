from enum import Enum


class RoleCode(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    CUSTOMER = "CUSTOMER"
    STUDENT = "STUDENT"


DEFAULT_ROLE_NAMES = {
    RoleCode.ADMIN: "Admin",
    RoleCode.STAFF: "Staff",
    RoleCode.CUSTOMER: "Customer",
    RoleCode.STUDENT: "Student",
}
