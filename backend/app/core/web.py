def public_url(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    if not stripped:
        return None
    lowered = stripped.lower()
    if lowered.startswith("https://") or lowered.startswith("http://"):
        return stripped
    if stripped.startswith("/") and not stripped.startswith("//") and "\\" not in stripped and "://" not in stripped:
        return stripped
    raise ValueError("URL must start with http://, https://, or /")


def storage_key(value: str | None) -> str | None:
    if value is None:
        return None
    key = value.strip().replace("\\", "/")
    if not key:
        return None
    parts = [part for part in key.split("/") if part not in {"", "."}]
    if not parts or any(part == ".." for part in parts) or ":" in key or key.startswith("/"):
        raise ValueError("Storage key must stay inside the download directory")
    return "/".join(parts)


BLOCKED_SETTING_KEYS = ("password", "secret", "token", "credential", "database", "jwt")


def setting_key(value: str) -> str:
    key = value.strip().lower()
    if any(part in key for part in BLOCKED_SETTING_KEYS):
        raise ValueError("This setting key is reserved")
    return key
