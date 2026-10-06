from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from app.api.files import download_response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_optional_user
from app.api.http import call_api, not_found
from app.models.auth import User
from app.schemas.academy import AcademyCheckoutRead, AcademyCheckoutRequest, CourseOutline, EnrollmentSummary, LearnCourse, ProgressRead
from app.services import academy

router = APIRouter(prefix="/academy", tags=["academy"])


@router.get("/courses/{slug}", response_model=CourseOutline, summary="Published course outline")
def course_outline(
    slug: str,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> CourseOutline:
    course = academy.outline(session, slug, user_id=user.id if user else None)
    if course is None:
        not_found()
    return course


@router.post("/checkout", response_model=AcademyCheckoutRead, summary="Buy a published course")
def checkout_course(
    data: AcademyCheckoutRequest,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> AcademyCheckoutRead:
    return call_api(lambda: academy.buy_course(session, user_id=user.id, course_id=data.course_id))


@router.get("/me", response_model=list[EnrollmentSummary], summary="Student enrollments")
def my_enrollments(
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[EnrollmentSummary]:
    return call_api(lambda: academy.dashboard(session, user_id=user.id))


@router.get("/study/{course_id}", response_model=LearnCourse, summary="Enrolled course content")
def study_course(
    course_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> LearnCourse:
    return call_api(lambda: academy.learn(session, user_id=user.id, course_id=course_id))


@router.post("/lessons/{lesson_id}/complete", response_model=ProgressRead, summary="Mark a lesson complete")
def complete_lesson(
    lesson_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ProgressRead:
    return call_api(lambda: academy.complete_lesson(session, user_id=user.id, lesson_id=lesson_id))


@router.get("/resources/{resource_id}/download", summary="Download an enrolled course resource")
def download_resource(
    resource_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    path = call_api(lambda: academy.download_resource(session, user_id=user.id, resource_id=resource_id))
    return download_response(path)
