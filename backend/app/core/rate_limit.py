import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request


class RateLimit:
    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()

    def __call__(self, request: Request) -> None:
        host = request.client.host if request.client else "unknown"
        key = f"{host}:{request.url.path}"
        now = time.monotonic()
        with self._lock:
            recent = [stamp for stamp in self._hits[key] if now - stamp < self.window_seconds]
            if len(recent) >= self.limit:
                raise HTTPException(status_code=429, detail="Too many requests. Try again shortly.")
            recent.append(now)
            self._hits[key] = recent


limit_auth = RateLimit(limit=20, window_seconds=60)
limit_forms = RateLimit(limit=10, window_seconds=60)
