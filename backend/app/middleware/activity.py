from uuid import UUID

import jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.admin import ActivityLog
from app.models.auth import User
from app.services.access import is_staff

_PREFIXES = (
    "/api/services",
    "/api/service-packages",
    "/api/products",
    "/api/categories",
    "/api/courses",
    "/api/testimonials",
    "/api/banners",
    "/api/blog-posts",
    "/api/homepage-sections",
    "/api/seo-settings",
    "/api/social-links",
    "/api/settings",
    "/api/enquiries",
    "/api/quote-requests",
)


def _entity_id(path: str) -> UUID | None:
    segment = path.rstrip("/").split("/")[-1]
    try:
        return UUID(segment)
    except ValueError:
        return None


class ActivityLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        if request.method not in {"POST", "PUT", "PATCH", "DELETE"} or response.status_code >= 400:
            return response
        path = request.url.path
        if not any(path == prefix or path.startswith(f"{prefix}/") for prefix in _PREFIXES):
            return response
        header = request.headers.get("authorization") or ""
        if not header.lower().startswith("bearer "):
            return response
        try:
            payload = decode_access_token(header.split(" ", 1)[1])
            if payload.get("type") != "access":
                return response
            user_id = UUID(str(payload.get("sub")))
            with SessionLocal() as session:
                user = session.get(User, user_id)
                if not is_staff(user):
                    return response
                session.add(
                    ActivityLog(
                        actor_user_id=user.id,
                        action=request.method.lower(),
                        entity_type=path.split("/")[2],
                        entity_id=_entity_id(path),
                    )
                )
                session.commit()
        except (jwt.InvalidTokenError, ValueError, TypeError):
            return response
        except Exception:
            return response
        return response
