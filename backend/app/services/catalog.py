from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.listing import apply_sort, like_pattern, paginate
from app.models.courses import Course, CourseCategory
from app.models.products import Product, ProductCategory, ProductPrice
from app.models.services import Service, ServiceCategory, ServicePackage
from app.schemas.catalog import (
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    CourseCreate,
    CourseRead,
    CourseUpdate,
    FeatureRead,
    PriceRead,
    ProductCreate,
    ProductFeatureRead,
    ProductImageRead,
    ProductRead,
    ProductUpdate,
    ServiceCreate,
    ServicePackageCreate,
    ServicePackageRead,
    ServicePackageUpdate,
    ServiceRead,
    ServiceUpdate,
)
from app.services.api_error import ApiError
from app.utils.slug import slugify

CATEGORY_MODELS = {
    "service": ServiceCategory,
    "product": ProductCategory,
    "course": CourseCategory,
}
CATEGORY_USAGE = {
    "service": Service,
    "product": Product,
    "course": Course,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _commit(session: Session) -> None:
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise ApiError(409, "A record with this value already exists") from exc


def _sort(statement: Select, columns: dict[str, object], sort: str, tie_break: object) -> Select:
    try:
        return apply_sort(statement, columns, sort, tie_break)
    except ValueError as exc:
        raise ApiError(422, str(exc)) from exc


def _search(statement: Select, columns: list[object], q: str | None) -> Select:
    if not q:
        return statement
    pattern = like_pattern(q)
    return statement.where(or_(*(column.ilike(pattern, escape="\\") for column in columns)))


def _slug_available(session: Session, model, slug: str, *, exclude_id: UUID | None = None, service_id: UUID | None = None) -> None:
    statement = select(model.id).where(model.slug == slug, model.deleted_at.is_(None))
    if exclude_id is not None:
        statement = statement.where(model.id != exclude_id)
    if service_id is not None:
        statement = statement.where(model.service_id == service_id)
    if session.scalar(statement) is not None:
        raise ApiError(409, "A record with this slug already exists")


def _currency(value: str | None) -> str | None:
    return value.upper() if value is not None else None


def _features(package: ServicePackage) -> list[FeatureRead]:
    rows = [feature for feature in package.features if feature.deleted_at is None]
    rows.sort(key=lambda feature: (feature.sort_order, feature.label))
    return [FeatureRead.model_validate(feature) for feature in rows]


def package_to_read(package: ServicePackage) -> ServicePackageRead:
    record = ServicePackageRead.model_validate(package)
    record.features = _features(package)
    return record


def service_to_read(service: Service, *, staff: bool) -> ServiceRead:
    packages = []
    for package in service.packages:
        if package.deleted_at is not None:
            continue
        if not staff and not package.is_published:
            continue
        packages.append(package_to_read(package))
    packages.sort(key=lambda package: (package.sort_order, package.name))
    record = ServiceRead.model_validate(service)
    record.packages = packages
    return record


def product_to_read(product: Product, *, staff: bool) -> ProductRead:
    prices = []
    for price in product.prices:
        if price.deleted_at is not None:
            continue
        if not staff and not price.is_active:
            continue
        prices.append(PriceRead.model_validate(price))
    features = [feature for feature in product.features if feature.deleted_at is None]
    features.sort(key=lambda feature: (feature.sort_order, feature.label))
    images = [image for image in product.images if image.deleted_at is None and image.variant_id is None]
    images.sort(key=lambda image: (not image.is_primary, image.sort_order))
    record = ProductRead.model_validate(product)
    record.prices = prices
    record.features = [ProductFeatureRead.model_validate(feature) for feature in features]
    record.images = [ProductImageRead.model_validate(image) for image in images]
    return record


def _service_query():
    return select(Service).options(selectinload(Service.packages).selectinload(ServicePackage.features))


def _package_query():
    return select(ServicePackage).options(
        selectinload(ServicePackage.features),
        selectinload(ServicePackage.service),
    )


def _product_query():
    return select(Product).options(
        selectinload(Product.prices),
        selectinload(Product.features),
        selectinload(Product.images),
    )


def _require_service(session: Session, service_id: UUID) -> Service:
    service = session.get(Service, service_id)
    if service is None or service.deleted_at is not None:
        raise ApiError(422, "Service was not found")
    return service


def _require_category(session: Session, kind: str, category_id: UUID | None) -> None:
    if category_id is None:
        return
    model = CATEGORY_MODELS[kind]
    category = session.get(model, category_id)
    if category is None or category.deleted_at is not None:
        raise ApiError(422, "Category was not found")


def _published_service(session: Session, service_id: UUID | None, *, staff: bool) -> None:
    if service_id is None:
        return
    service = session.get(Service, service_id)
    if service is None or service.deleted_at is not None or (not staff and not service.is_published):
        raise ApiError(422, "Service was not found")


def list_services(
    session: Session,
    *,
    staff: bool,
    page: int,
    page_size: int,
    q: str | None,
    sort: str,
    business_area,
    category_id: UUID | None,
    is_published: bool | None,
) -> tuple[list[ServiceRead], int]:
    statement = _service_query().where(Service.deleted_at.is_(None))
    if staff and is_published is not None:
        statement = statement.where(Service.is_published.is_(is_published))
    elif not staff:
        statement = statement.where(Service.is_published.is_(True))
    if business_area is not None:
        statement = statement.where(Service.business_area == business_area)
    if category_id is not None:
        statement = statement.where(Service.category_id == category_id)
    statement = _search(statement, [Service.name, Service.summary, Service.slug], q)
    statement = _sort(
        statement,
        {"name": Service.name, "slug": Service.slug, "created_at": Service.created_at, "sort_order": Service.sort_order},
        sort,
        Service.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [service_to_read(row, staff=staff) for row in rows], total


def get_service_by_slug(session: Session, slug: str, *, staff: bool) -> ServiceRead | None:
    statement = _service_query().where(Service.slug == slug, Service.deleted_at.is_(None))
    if not staff:
        statement = statement.where(Service.is_published.is_(True))
    service = session.scalars(statement).first()
    if service is None:
        return None
    return service_to_read(service, staff=staff)


def create_service(session: Session, data: ServiceCreate) -> ServiceRead:
    _require_category(session, "service", data.category_id)
    slug = slugify(data.slug or data.name)
    _slug_available(session, Service, slug)
    service = Service(
        name=data.name.strip(),
        slug=slug,
        business_area=data.business_area,
        category_id=data.category_id,
        summary=data.summary,
        description=data.description,
        sort_order=data.sort_order,
        is_published=data.is_published,
    )
    session.add(service)
    _commit(session)
    created = get_service_by_slug(session, service.slug, staff=True)
    if created is None:
        raise ApiError(500, "Could not save the service")
    return created


def update_service(session: Session, service_id: UUID, data: ServiceUpdate) -> ServiceRead | None:
    service = session.get(Service, service_id)
    if service is None or service.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    if "category_id" in changes:
        _require_category(session, "service", changes["category_id"])
    if "slug" in changes:
        slug = slugify(changes["slug"])
        _slug_available(session, Service, slug, exclude_id=service.id)
        changes["slug"] = slug
    if "name" in changes and changes["name"] is not None:
        changes["name"] = changes["name"].strip()
    for key, value in changes.items():
        setattr(service, key, value)
    _commit(session)
    return get_service_by_slug(session, service.slug, staff=True)


def delete_service(session: Session, service_id: UUID) -> bool:
    service = session.get(Service, service_id)
    if service is None or service.deleted_at is not None:
        return False
    moment = _now()
    packages = session.scalars(
        select(ServicePackage).where(ServicePackage.service_id == service.id, ServicePackage.deleted_at.is_(None))
    ).all()
    for package in packages:
        package.deleted_at = moment
        for feature in package.features:
            if feature.deleted_at is None:
                feature.deleted_at = moment
    service.deleted_at = moment
    _commit(session)
    return True


def list_packages(
    session: Session,
    *,
    staff: bool,
    page: int,
    page_size: int,
    q: str | None,
    sort: str,
    service_id: UUID | None,
    billing_period,
    is_published: bool | None,
) -> tuple[list[ServicePackageRead], int]:
    statement = _package_query().join(Service, ServicePackage.service_id == Service.id).where(
        ServicePackage.deleted_at.is_(None),
        Service.deleted_at.is_(None),
    )
    if staff and is_published is not None:
        statement = statement.where(ServicePackage.is_published.is_(is_published))
    elif not staff:
        statement = statement.where(ServicePackage.is_published.is_(True), Service.is_published.is_(True))
    if service_id is not None:
        statement = statement.where(ServicePackage.service_id == service_id)
    if billing_period is not None:
        statement = statement.where(ServicePackage.billing_period == billing_period)
    statement = _search(statement, [ServicePackage.name, ServicePackage.summary, ServicePackage.slug], q)
    statement = _sort(
        statement,
        {
            "name": ServicePackage.name,
            "slug": ServicePackage.slug,
            "created_at": ServicePackage.created_at,
            "sort_order": ServicePackage.sort_order,
            "price_amount": ServicePackage.price_amount,
        },
        sort,
        ServicePackage.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [package_to_read(row) for row in rows], total


def get_package(session: Session, package_id: UUID, *, staff: bool) -> ServicePackageRead | None:
    package = session.scalars(_package_query().where(ServicePackage.id == package_id, ServicePackage.deleted_at.is_(None))).first()
    if package is None or package.service.deleted_at is not None:
        return None
    if not staff and (not package.is_published or not package.service.is_published):
        return None
    return package_to_read(package)


def create_package(session: Session, data: ServicePackageCreate) -> ServicePackageRead:
    _require_service(session, data.service_id)
    slug = slugify(data.slug or data.name)
    _slug_available(session, ServicePackage, slug, service_id=data.service_id)
    package = ServicePackage(
        service_id=data.service_id,
        name=data.name.strip(),
        slug=slug,
        summary=data.summary,
        price_amount=data.price_amount,
        currency=_currency(data.currency) or "INR",
        billing_period=data.billing_period,
        sort_order=data.sort_order,
        is_published=data.is_published,
    )
    session.add(package)
    _commit(session)
    created = get_package(session, package.id, staff=True)
    if created is None:
        raise ApiError(500, "Could not save the package")
    return created


def update_package(session: Session, package_id: UUID, data: ServicePackageUpdate) -> ServicePackageRead | None:
    package = session.get(ServicePackage, package_id)
    if package is None or package.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    service_id = changes.get("service_id", package.service_id)
    _require_service(session, service_id)
    if "slug" in changes:
        slug = slugify(changes["slug"])
        _slug_available(session, ServicePackage, slug, exclude_id=package.id, service_id=service_id)
        changes["slug"] = slug
    elif "service_id" in changes:
        _slug_available(session, ServicePackage, package.slug, exclude_id=package.id, service_id=service_id)
    if "name" in changes and changes["name"] is not None:
        changes["name"] = changes["name"].strip()
    if "currency" in changes:
        changes["currency"] = _currency(changes["currency"])
    for key, value in changes.items():
        setattr(package, key, value)
    _commit(session)
    return get_package(session, package.id, staff=True)


def delete_package(session: Session, package_id: UUID) -> bool:
    package = session.scalars(_package_query().where(ServicePackage.id == package_id)).first()
    if package is None or package.deleted_at is not None:
        return False
    moment = _now()
    package.deleted_at = moment
    for feature in package.features:
        if feature.deleted_at is None:
            feature.deleted_at = moment
    _commit(session)
    return True


def _active_price_amount():
    return (
        select(func.min(ProductPrice.amount))
        .where(
            ProductPrice.product_id == Product.id,
            ProductPrice.deleted_at.is_(None),
            ProductPrice.is_active.is_(True),
        )
        .correlate(Product)
        .scalar_subquery()
    )


def list_products(
    session: Session,
    *,
    staff: bool,
    page: int,
    page_size: int,
    q: str | None,
    sort: str,
    business_area,
    category_id: UUID | None,
    product_type,
    listing_channel,
    is_published: bool | None,
    for_shop: bool = False,
    min_price=None,
    max_price=None,
) -> tuple[list[ProductRead], int]:
    statement = _product_query().where(Product.deleted_at.is_(None))
    price_amount = _active_price_amount()
    if staff and is_published is not None:
        statement = statement.where(Product.is_published.is_(is_published))
    elif not staff:
        statement = statement.where(Product.is_published.is_(True))
    if business_area is not None:
        statement = statement.where(Product.business_area == business_area)
    if category_id is not None:
        statement = statement.where(Product.category_id == category_id)
    if product_type is not None:
        statement = statement.where(Product.product_type == product_type)
    if for_shop:
        statement = statement.where(Product.listing_channel.in_(("shop", "both")))
    elif listing_channel is not None:
        statement = statement.where(Product.listing_channel == listing_channel)
    if min_price is not None:
        statement = statement.where(price_amount >= min_price)
    if max_price is not None:
        statement = statement.where(price_amount <= max_price)
    statement = _search(statement, [Product.name, Product.summary, Product.slug, Product.sku], q)
    statement = _sort(
        statement,
        {
            "name": Product.name,
            "slug": Product.slug,
            "created_at": Product.created_at,
            "sort_order": Product.sort_order,
            "price": price_amount,
        },
        sort,
        Product.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [product_to_read(row, staff=staff) for row in rows], total


def get_product_by_slug(session: Session, slug: str, *, staff: bool) -> ProductRead | None:
    statement = _product_query().where(Product.slug == slug, Product.deleted_at.is_(None))
    if not staff:
        statement = statement.where(Product.is_published.is_(True))
    product = session.scalars(statement).first()
    if product is None:
        return None
    return product_to_read(product, staff=staff)


def _sku_available(session: Session, sku: str | None, exclude_id: UUID | None = None) -> None:
    if not sku:
        return
    statement = select(Product.id).where(Product.sku == sku, Product.deleted_at.is_(None))
    if exclude_id is not None:
        statement = statement.where(Product.id != exclude_id)
    if session.scalar(statement) is not None:
        raise ApiError(409, "A product with this SKU already exists")


def create_product(session: Session, data: ProductCreate) -> ProductRead:
    _require_category(session, "product", data.category_id)
    slug = slugify(data.slug or data.name)
    _slug_available(session, Product, slug)
    sku = data.sku.strip() if data.sku else None
    _sku_available(session, sku)
    product = Product(
        name=data.name.strip(),
        slug=slug,
        business_area=data.business_area,
        product_type=data.product_type,
        listing_channel=data.listing_channel,
        category_id=data.category_id,
        summary=data.summary,
        description=data.description,
        sku=sku,
        demo_url=data.demo_url,
        download_storage_key=data.download_storage_key,
        is_downloadable=data.is_downloadable,
        track_stock=data.track_stock,
        stock_quantity=data.stock_quantity,
        sort_order=data.sort_order,
        is_published=data.is_published,
    )
    session.add(product)
    _commit(session)
    created = get_product_by_slug(session, product.slug, staff=True)
    if created is None:
        raise ApiError(500, "Could not save the product")
    return created


def update_product(session: Session, product_id: UUID, data: ProductUpdate) -> ProductRead | None:
    product = session.get(Product, product_id)
    if product is None or product.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    if "category_id" in changes:
        _require_category(session, "product", changes["category_id"])
    if "slug" in changes:
        slug = slugify(changes["slug"])
        _slug_available(session, Product, slug, exclude_id=product.id)
        changes["slug"] = slug
    if "sku" in changes:
        sku = changes["sku"].strip() if changes["sku"] else None
        _sku_available(session, sku, exclude_id=product.id)
        changes["sku"] = sku
    if "name" in changes and changes["name"] is not None:
        changes["name"] = changes["name"].strip()
    for key, value in changes.items():
        setattr(product, key, value)
    _commit(session)
    return get_product_by_slug(session, product.slug, staff=True)


def delete_product(session: Session, product_id: UUID) -> bool:
    product = session.get(Product, product_id)
    if product is None or product.deleted_at is not None:
        return False
    product.deleted_at = _now()
    _commit(session)
    return True


def list_courses(
    session: Session,
    *,
    staff: bool,
    page: int,
    page_size: int,
    q: str | None,
    sort: str,
    business_area,
    category_id: UUID | None,
    level: str | None,
    is_published: bool | None,
) -> tuple[list[CourseRead], int]:
    statement = select(Course).where(Course.deleted_at.is_(None))
    if staff and is_published is not None:
        statement = statement.where(Course.is_published.is_(is_published))
    elif not staff:
        statement = statement.where(Course.is_published.is_(True))
    if business_area is not None:
        statement = statement.where(Course.business_area == business_area)
    if category_id is not None:
        statement = statement.where(Course.category_id == category_id)
    if level:
        statement = statement.where(Course.level == level)
    statement = _search(statement, [Course.title, Course.summary, Course.slug], q)
    statement = _sort(
        statement,
        {"title": Course.title, "slug": Course.slug, "created_at": Course.created_at, "sort_order": Course.sort_order},
        sort,
        Course.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [CourseRead.model_validate(row) for row in rows], total


def get_course_by_slug(session: Session, slug: str, *, staff: bool) -> CourseRead | None:
    statement = select(Course).where(Course.slug == slug, Course.deleted_at.is_(None))
    if not staff:
        statement = statement.where(Course.is_published.is_(True))
    course = session.scalars(statement).first()
    if course is None:
        return None
    return CourseRead.model_validate(course)


def create_course(session: Session, data: CourseCreate) -> CourseRead:
    _require_category(session, "course", data.category_id)
    slug = slugify(data.slug or data.title)
    _slug_available(session, Course, slug)
    course = Course(
        title=data.title.strip(),
        slug=slug,
        business_area=data.business_area,
        category_id=data.category_id,
        summary=data.summary,
        description=data.description,
        level=data.level,
        duration_label=data.duration_label,
        thumbnail_url=data.thumbnail_url,
        learning_outcomes=list(data.learning_outcomes),
        certificate_enabled=data.certificate_enabled,
        price_amount=data.price_amount,
        currency=_currency(data.currency) or "INR",
        sort_order=data.sort_order,
        is_published=data.is_published,
    )
    session.add(course)
    _commit(session)
    created = get_course_by_slug(session, course.slug, staff=True)
    if created is None:
        raise ApiError(500, "Could not save the course")
    return created


def update_course(session: Session, course_id: UUID, data: CourseUpdate) -> CourseRead | None:
    course = session.get(Course, course_id)
    if course is None or course.deleted_at is not None:
        return None
    changes = data.model_dump(exclude_unset=True)
    if "category_id" in changes:
        _require_category(session, "course", changes["category_id"])
    if "slug" in changes:
        slug = slugify(changes["slug"])
        _slug_available(session, Course, slug, exclude_id=course.id)
        changes["slug"] = slug
    if "title" in changes and changes["title"] is not None:
        changes["title"] = changes["title"].strip()
    if "currency" in changes:
        changes["currency"] = _currency(changes["currency"])
    for key, value in changes.items():
        setattr(course, key, value)
    _commit(session)
    return get_course_by_slug(session, course.slug, staff=True)


def delete_course(session: Session, course_id: UUID) -> bool:
    course = session.get(Course, course_id)
    if course is None or course.deleted_at is not None:
        return False
    course.deleted_at = _now()
    _commit(session)
    return True


def _category_to_read(row, kind: str) -> CategoryRead:
    return CategoryRead(
        id=row.id,
        kind=kind,
        parent_id=row.parent_id,
        slug=row.slug,
        name=row.name,
        description=row.description,
        sort_order=row.sort_order,
        is_published=row.is_published,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _assert_parent(session: Session, model, parent_id: UUID | None, self_id: UUID | None = None) -> None:
    if parent_id is None:
        return
    if self_id is not None and parent_id == self_id:
        raise ApiError(422, "A category cannot be its own parent")
    current = parent_id
    seen: set[UUID] = set()
    while current is not None:
        if current in seen or current == self_id:
            raise ApiError(422, "Category parent would create a cycle")
        seen.add(current)
        parent = session.get(model, current)
        if parent is None or parent.deleted_at is not None:
            raise ApiError(422, "Parent category was not found")
        current = parent.parent_id


def list_categories(
    session: Session,
    *,
    kind: str,
    staff: bool,
    page: int,
    page_size: int,
    q: str | None,
    sort: str,
    parent_id: UUID | None,
    is_published: bool | None,
) -> tuple[list[CategoryRead], int]:
    model = CATEGORY_MODELS[kind]
    statement = select(model).where(model.deleted_at.is_(None))
    if staff and is_published is not None:
        statement = statement.where(model.is_published.is_(is_published))
    elif not staff:
        statement = statement.where(model.is_published.is_(True))
    if parent_id is not None:
        statement = statement.where(model.parent_id == parent_id)
    statement = _search(statement, [model.name, model.slug, model.description], q)
    statement = _sort(
        statement,
        {"name": model.name, "slug": model.slug, "created_at": model.created_at, "sort_order": model.sort_order},
        sort,
        model.id,
    )
    rows, total = paginate(session, statement, page, page_size)
    return [_category_to_read(row, kind) for row in rows], total


def create_category(session: Session, data: CategoryCreate) -> CategoryRead:
    model = CATEGORY_MODELS[data.kind]
    _assert_parent(session, model, data.parent_id)
    slug = slugify(data.slug or data.name)
    _slug_available(session, model, slug)
    category = model(
        name=data.name.strip(),
        slug=slug,
        parent_id=data.parent_id,
        description=data.description,
        sort_order=data.sort_order,
        is_published=data.is_published,
    )
    session.add(category)
    _commit(session)
    session.refresh(category)
    return _category_to_read(category, data.kind)


def _find_category(session: Session, category_id: UUID):
    for kind, model in CATEGORY_MODELS.items():
        row = session.get(model, category_id)
        if row is not None and row.deleted_at is None:
            return kind, model, row
    return None


def update_category(session: Session, category_id: UUID, data: CategoryUpdate) -> CategoryRead | None:
    found = _find_category(session, category_id)
    if found is None:
        return None
    kind, model, category = found
    changes = data.model_dump(exclude_unset=True)
    if "parent_id" in changes:
        _assert_parent(session, model, changes["parent_id"], self_id=category.id)
    if "slug" in changes:
        slug = slugify(changes["slug"])
        _slug_available(session, model, slug, exclude_id=category.id)
        changes["slug"] = slug
    if "name" in changes and changes["name"] is not None:
        changes["name"] = changes["name"].strip()
    for key, value in changes.items():
        setattr(category, key, value)
    _commit(session)
    session.refresh(category)
    return _category_to_read(category, kind)


def delete_category(session: Session, category_id: UUID) -> bool:
    found = _find_category(session, category_id)
    if found is None:
        return False
    kind, model, category = found
    usage = CATEGORY_USAGE[kind]
    child = session.scalar(select(model.id).where(model.parent_id == category.id, model.deleted_at.is_(None)))
    referenced = session.scalar(select(usage.id).where(usage.category_id == category.id, usage.deleted_at.is_(None)))
    if child is not None or referenced is not None:
        raise ApiError(409, "Category is still in use")
    category.deleted_at = _now()
    _commit(session)
    return True
