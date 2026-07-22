import asyncio
from collections.abc import Iterator
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx
import pytest

from educhain_evidence.config.settings import get_settings
from educhain_evidence.main import create_app

SERVICE_TOKEN = "test-service-token-that-is-long-enough"


class ApiClient:
    def __init__(self, loop: asyncio.AbstractEventLoop, client: httpx.AsyncClient) -> None:
        self._loop = loop
        self._client = client

    def get(self, path: str, **kwargs: Any) -> httpx.Response:
        return self._loop.run_until_complete(self._client.get(path, **kwargs))

    def post(self, path: str, **kwargs: Any) -> httpx.Response:
        return self._loop.run_until_complete(self._client.post(path, **kwargs))


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Iterator[ApiClient]:
    monkeypatch.setenv("EDUCHAIN_EVIDENCE_INTERNAL_SERVICE_TOKEN", SERVICE_TOKEN)
    monkeypatch.setenv("EDUCHAIN_EVIDENCE_DATA_PATH", str(tmp_path / "evidence.sqlite3"))
    monkeypatch.setenv("EDUCHAIN_EVIDENCE_CERTIFICATE_STORAGE_PATH", str(tmp_path / "certificates"))
    get_settings.cache_clear()
    app = create_app()
    loop = asyncio.new_event_loop()
    lifespan = app.router.lifespan_context(app)
    async_client = httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://testserver"
    )
    try:
        loop.run_until_complete(lifespan.__aenter__())
        loop.run_until_complete(async_client.__aenter__())
        yield ApiClient(loop, async_client)
    finally:
        loop.run_until_complete(async_client.__aexit__(None, None, None))
        loop.run_until_complete(lifespan.__aexit__(None, None, None))
        loop.close()
        get_settings.cache_clear()


def evidence_payload() -> dict[str, object]:
    return {
        "resource_id": str(uuid4()),
        "version_id": str(uuid4()),
        "author_proof_id": "author-proof-0001",
        "canonicalization_version": "v1",
        "payload_version": 1,
        "content_digest": "a" * 64,
        "attachment_merkle_root": None,
        "published_at": "2026-07-01T00:00:00Z",
    }


def internal_headers(*, payload_version: str = "1") -> dict[str, str]:
    return {
        "X-Service-Token": SERVICE_TOKEN,
        "X-Request-Id": str(uuid4()),
        "Idempotency-Key": "resource-version-0001",
        "X-Payload-Version": payload_version,
    }


def test_health_and_internal_metrics(client: ApiClient) -> None:
    health = client.get("/health")
    unauthorized = client.get("/metrics")
    metrics = client.get("/metrics", headers={"X-Service-Token": SERVICE_TOKEN})

    assert health.status_code == 200
    assert health.json()["backend"]["backend"] == "SIMULATOR"
    assert unauthorized.status_code == 401
    assert metrics.status_code == 200
    assert "educhain_evidence_http_requests_total" in metrics.text


def test_submit_lookup_and_verify_evidence(client: ApiClient) -> None:
    unauthorized = client.post("/evidence", json=evidence_payload(), headers={})
    submitted = client.post("/evidence", json=evidence_payload(), headers=internal_headers())

    assert unauthorized.status_code == 401
    assert unauthorized.headers["content-type"].startswith("application/problem+json")
    assert unauthorized.json()["code"] == "INTERNAL_AUTHENTICATION_REQUIRED"
    assert submitted.status_code == 202
    proof = submitted.json()
    assert proof["status"] == "CONFIRMED"

    public_lookup = client.get(f"/evidence/{proof['proof_id']}")
    submission_lookup = client.get(
        "/evidence/submissions/resource-version-0001",
        headers={"X-Service-Token": SERVICE_TOKEN},
    )
    verified = client.post(
        "/verifications",
        json={"proof_id": proof["proof_id"], "content_digest": "a" * 64},
        headers={
            "X-Service-Token": SERVICE_TOKEN,
            "X-Request-Id": str(uuid4()),
            "X-Payload-Version": "1",
        },
    )

    assert public_lookup.status_code == 200
    assert submission_lookup.status_code == 200
    assert verified.status_code == 200
    assert verified.json()["result"] == "MATCHED"


def test_payload_version_mismatch_uses_the_shared_problem_shape(client: ApiClient) -> None:
    response = client.post(
        "/evidence", json=evidence_payload(), headers=internal_headers(payload_version="2")
    )

    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["code"] == "FIELD_VALIDATION_FAILED"
    assert response.json()["requestId"]
