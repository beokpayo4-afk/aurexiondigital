from app.api.deps import get_db, require_roles
from app.models import Base
from app.repositories.base import Repository
from app.utils.time import utc_now


def test_foundation_imports() -> None:
    assert Base.metadata is not None
    assert callable(get_db)
    assert callable(require_roles)
    assert Repository is not None
    assert utc_now().tzinfo is not None
