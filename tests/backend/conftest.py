from fastapi.testclient import TestClient
import pytest

from backend.app import create_app


@pytest.fixture()
def api_client() -> TestClient:
    return TestClient(create_app())
