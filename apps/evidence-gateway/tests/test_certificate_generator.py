from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from reportlab import __file__ as reportlab_module_path

from educhain_evidence.adapters.certificate.generator import CertificateGenerator
from educhain_evidence.application.models import (
    CertificateRequest,
    EvidencePayload,
    EvidenceProof,
    EvidenceStatus,
)


def test_generates_and_reuses_pdf_certificate(tmp_path: Path) -> None:
    font_path = Path(reportlab_module_path).parent / "fonts" / "Vera.ttf"
    generator = CertificateGenerator(tmp_path, "http://localhost:3000/zh-CN", font_path)
    now = datetime.now(UTC)
    payload = EvidencePayload(
        resource_id=uuid4(),
        version_id=uuid4(),
        author_proof_id="author-proof-0001",
        canonicalization_version="v2",
        payload_version=1,
        content_digest="a" * 64,
        published_at=now,
    )
    proof = EvidenceProof(
        proof_id=uuid4(),
        status=EvidenceStatus.CONFIRMED,
        backend="SIMULATOR",
        network_id="educhain-simulator-v1",
        transaction_id="b" * 64,
        block_height=1,
        block_hash="c" * 64,
        submitted_at=now,
        confirmed_at=now,
        payload_digest="d" * 64,
        payload=payload,
    )
    request = CertificateRequest(
        resource_title="Certificate integration test",
        version_number=1,
        author_display_name="EduChain Test",
    )

    first = generator.generate(proof, request)
    second = generator.generate(proof, request)
    content = generator.read(str(proof.proof_id))

    assert first == second
    assert first.media_type == "application/pdf"
    assert content is not None
    assert content.startswith(b"%PDF-")
    assert first.size_bytes == len(content)
