from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.sitemap import build_sitemap, robots_txt

router = APIRouter(tags=["content"])


@router.get("/robots.txt", include_in_schema=False)
def robots() -> Response:
    return Response(content=robots_txt(), media_type="text/plain", headers={"Cache-Control": "public, max-age=300"})


@router.get("/sitemap.xml", include_in_schema=False)
def sitemap(session: Session = Depends(get_db)) -> Response:
    return Response(content=build_sitemap(session), media_type="application/xml", headers={"Cache-Control": "public, max-age=300"})
