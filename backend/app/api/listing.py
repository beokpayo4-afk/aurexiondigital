from typing import Annotated

from fastapi import Query
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

MAX_PAGE_SIZE = 50


def page_params(
    page: Annotated[int, Query(ge=1, description="Page number, starting at 1.")] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE, description="Items per page. Maximum 50.")] = 20,
) -> tuple[int, int]:
    return page, page_size


def search_param(
    q: Annotated[str | None, Query(max_length=200, description="Case-insensitive search text.")] = None,
) -> str | None:
    if q is None:
        return None
    stripped = q.strip()
    return stripped or None


def like_pattern(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def apply_sort(statement: Select, columns: dict[str, object], sort: str, tie_break: object | None = None) -> Select:
    descending = sort.startswith("-")
    key = sort[1:] if descending else sort
    column = columns.get(key)
    if column is None:
        allowed = ", ".join(sorted(columns))
        raise ValueError(f"Sort must be one of: {allowed}")
    ordered = column.desc() if descending else column.asc()
    if tie_break is None:
        return statement.order_by(ordered)
    return statement.order_by(ordered, tie_break.asc())


def paginate(session: Session, statement: Select, page: int, page_size: int) -> tuple[list, int]:
    count_statement = select(func.count()).select_from(statement.order_by(None).subquery())
    total = session.scalar(count_statement) or 0
    rows = session.scalars(statement.offset((page - 1) * page_size).limit(page_size)).all()
    return list(rows), int(total)
