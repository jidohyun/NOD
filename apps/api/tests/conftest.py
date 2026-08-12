import pytest
import sentry_sdk
from fastapi.testclient import TestClient

from src.main import app

# Disable Sentry after app import to prevent test errors being reported
sentry_sdk.init(dsn=None)


@pytest.fixture
def client() -> TestClient:
    """Test client fixture."""
    return TestClient(app)
