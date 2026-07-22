import json
from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path

import qrcode
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas

from educhain_evidence.application.errors import EvidenceConfigurationError
from educhain_evidence.application.models import (
    CertificateArtifact,
    CertificateRequest,
    EvidenceProof,
)
from educhain_evidence.crypto.hashing import sha256_hex


class CertificateGenerator:
    template_version = "certificate-v1"
    font_name = "EduChainCertificate"

    def __init__(self, storage_path: Path, public_base_url: str, font_path: Path | None) -> None:
        self._storage_path = storage_path
        self._public_base_url = public_base_url.rstrip("/")
        self._font_path = font_path
        self._storage_path.mkdir(parents=True, exist_ok=True)

    def generate(self, proof: EvidenceProof, request: CertificateRequest) -> CertificateArtifact:
        object_key = f"certificates/{proof.proof_id}-{self.template_version}.pdf"
        output_path = self._storage_path / object_key.removeprefix("certificates/")
        manifest_path = output_path.with_suffix(".json")
        if output_path.exists() and manifest_path.exists():
            return CertificateArtifact.model_validate_json(
                manifest_path.read_text(encoding="utf-8")
            )

        font_path = self._resolve_font()
        pdfmetrics.registerFont(TTFont(self.font_name, str(font_path), subfontIndex=0))
        generated_at = datetime.now(UTC)
        pdf_bytes = self._render(proof, request, generated_at)
        output_path.write_bytes(pdf_bytes)
        artifact = CertificateArtifact(
            proof_id=proof.proof_id,
            object_key=object_key,
            size_bytes=len(pdf_bytes),
            sha256=sha256_hex(pdf_bytes),
            template_version=self.template_version,
            generated_at=generated_at,
        )
        manifest_path.write_text(
            json.dumps(artifact.model_dump(mode="json"), ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        return artifact

    def read(self, proof_id: str) -> bytes | None:
        path = self._storage_path / f"{proof_id}-{self.template_version}.pdf"
        return path.read_bytes() if path.is_file() else None

    def _render(
        self,
        proof: EvidenceProof,
        request: CertificateRequest,
        generated_at: datetime,
    ) -> bytes:
        target = BytesIO()
        canvas = Canvas(target, pagesize=A4, pageCompression=1, invariant=1)
        width, height = A4
        navy = HexColor("#172033")
        blue = HexColor("#1769E0")
        muted = HexColor("#667085")
        line = HexColor("#D8DEE8")

        canvas.setFillColor(navy)
        canvas.rect(0, height - 74, width, 74, fill=1, stroke=0)
        canvas.setFillColor(HexColor("#FFFFFF"))
        canvas.setFont(self.font_name, 13)
        canvas.drawString(44, height - 44, "EduChain · 可信教育资源")
        canvas.setFillColor(blue)
        canvas.rect(44, height - 118, 52, 4, fill=1, stroke=0)
        canvas.setFillColor(navy)
        canvas.setFont(self.font_name, 27)
        canvas.drawString(44, height - 154, "教育资源存证证书")
        canvas.setFillColor(muted)
        canvas.setFont(self.font_name, 10)
        canvas.drawString(44, height - 176, "Evidence Certificate · 证明事实的可读展示")

        source = "长安链" if proof.backend == "CHAINMAKER" else "本地模拟器（非真实链）"
        rows = [
            ("资源", request.resource_title),
            ("版本", f"第 {request.version_number} 版"),
            ("作者", request.author_display_name),
            ("证明来源", source),
            ("网络", proof.network_id),
            ("证明标识", str(proof.proof_id)),
            ("内容摘要", proof.payload.content_digest),
            ("附件 Merkle Root", proof.payload.attachment_merkle_root or "无附件"),
            ("交易标识", proof.transaction_id or "待确认"),
            ("区块高度", str(proof.block_height) if proof.block_height is not None else "待确认"),
        ]
        y = height - 222
        for label, value in rows:
            canvas.setStrokeColor(line)
            canvas.line(44, y - 12, width - 44, y - 12)
            canvas.setFillColor(muted)
            canvas.setFont(self.font_name, 9)
            canvas.drawString(44, y, label)
            canvas.setFillColor(navy)
            canvas.setFont(self.font_name, 9)
            canvas.drawString(142, y, self._compact(value, 66))
            y -= 34

        verification_url = f"{self._public_base_url}/verify?proofId={proof.proof_id}"
        qr_image = qrcode.make(verification_url)
        qr_buffer = BytesIO()
        qr_image.save(qr_buffer)
        qr_buffer.seek(0)
        canvas.drawImage(ImageReader(qr_buffer), 44, 72, width=82, height=82, mask="auto")
        canvas.setFillColor(navy)
        canvas.setFont(self.font_name, 10)
        canvas.drawString(142, 137, "扫码进入稳定核验页面")
        canvas.setFillColor(muted)
        canvas.setFont(self.font_name, 8)
        canvas.drawString(142, 119, self._compact(verification_url, 72))
        canvas.drawString(142, 95, f"模板：{self.template_version}")
        canvas.drawString(142, 80, f"生成记录：{generated_at.isoformat()}")
        canvas.setStrokeColor(line)
        canvas.line(44, 60, width - 44, 60)
        canvas.setFont(self.font_name, 7.5)
        disclaimer = "本证书用于展示 EduChain 记录的存证事实，不自动替代法律认定或权属合同。"
        canvas.drawString(44, 42, disclaimer)
        canvas.save()
        return target.getvalue()

    def _resolve_font(self) -> Path:
        candidates = [
            self._font_path,
            Path("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"),
            Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
            Path("/System/Library/Fonts/Hiragino Sans GB.ttc"),
            Path("/System/Library/Fonts/STHeiti Medium.ttc"),
        ]
        for candidate in candidates:
            if candidate is not None and candidate.is_file():
                return candidate
        raise EvidenceConfigurationError(
            "A Chinese-capable certificate font must be mounted and configured."
        )

    @staticmethod
    def _compact(value: str, limit: int) -> str:
        return value if len(value) <= limit else f"{value[: limit - 1]}…"
