import enum

from sqlalchemy import Enum


class BusinessArea(str, enum.Enum):
    MARKETING_ADVERTISING = "marketing-advertising"
    TECHNOLOGY_DIGITAL_PRODUCTS = "technology-digital-products"
    EDUCATION_ACADEMY = "education-academy"
    BUSINESS_SOLUTIONS = "business-solutions"


class ProductType(str, enum.Enum):
    SOFTWARE = "software"
    SAAS = "saas"
    DIGITAL = "digital"
    ECOMMERCE = "ecommerce"


class ListingChannel(str, enum.Enum):
    TECHNOLOGY = "technology"
    SHOP = "shop"
    BOTH = "both"


class BillingPeriod(str, enum.Enum):
    ONE_TIME = "one_time"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class LessonContentType(str, enum.Enum):
    TEXT = "text"
    VIDEO_URL = "video_url"
    FILE = "file"


class EnrollmentStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EnrollmentSource(str, enum.Enum):
    MANUAL = "manual"
    ORDER = "order"


class CertificateStatus(str, enum.Enum):
    ISSUED = "issued"
    REVOKED = "revoked"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"
    FULFILLED = "fulfilled"
    REFUNDED = "refunded"


class OrderItemType(str, enum.Enum):
    PRODUCT = "product"
    PACKAGE = "package"
    COURSE = "course"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    IN_PROGRESS = "in_progress"
    PROPOSAL_SENT = "proposal_sent"
    CONVERTED = "converted"
    CLOSED = "closed"


class QuoteStatus(str, enum.Enum):
    NEW = "new"
    REVIEWING = "reviewing"
    QUOTED = "quoted"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CLOSED = "closed"


def _values(choices: type[enum.Enum]) -> list[str]:
    return [choice.value for choice in choices]


def pg_enum(enum_class: type[enum.Enum], name: str) -> Enum:
    return Enum(enum_class, name=name, native_enum=True, values_callable=_values)


BUSINESS_AREA = pg_enum(BusinessArea, "business_area")
PRODUCT_TYPE = pg_enum(ProductType, "product_type")
LISTING_CHANNEL = pg_enum(ListingChannel, "listing_channel")
BILLING_PERIOD = pg_enum(BillingPeriod, "billing_period")
LESSON_CONTENT_TYPE = pg_enum(LessonContentType, "lesson_content_type")
ENROLLMENT_STATUS = pg_enum(EnrollmentStatus, "enrollment_status")
ENROLLMENT_SOURCE = pg_enum(EnrollmentSource, "enrollment_source")
CERTIFICATE_STATUS = pg_enum(CertificateStatus, "certificate_status")
ORDER_STATUS = pg_enum(OrderStatus, "order_status")
ORDER_ITEM_TYPE = pg_enum(OrderItemType, "order_item_type")
PAYMENT_STATUS = pg_enum(PaymentStatus, "payment_status")
LEAD_STATUS = pg_enum(LeadStatus, "lead_status")
QUOTE_STATUS = pg_enum(QuoteStatus, "quote_status")
