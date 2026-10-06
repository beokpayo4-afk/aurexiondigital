import re
import uuid


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return slug[:160] or "item"


def unique_slug(base: str, taken: set[str]) -> str:
    slug = slugify(base)
    if slug not in taken:
        return slug
    suffix = uuid.uuid4().hex[:8]
    trimmed = slug[:151].rstrip("-")
    return f"{trimmed}-{suffix}"
