import pytest

from app.core.rate_limit import limit_auth, limit_forms


@pytest.fixture(autouse=True)
def reset_rate_limits():
    limit_auth.reset()
    limit_forms.reset()
    yield
    limit_auth.reset()
    limit_forms.reset()
