from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="EDUCHAIN_EVIDENCE_",
        extra="ignore",
    )

    mode: Literal["simulator", "chainmaker"] = "simulator"
    deployment_environment: Literal["local", "integration", "demonstration", "production-like"] = (
        "local"
    )
    service_version: str = Field(default="0.1.0", min_length=1, max_length=64)
    data_path: Path = Path("./data/evidence-simulator.sqlite3")
    log_level: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    internal_service_token: str = Field(min_length=32)
    public_base_url: str = "http://localhost:3000"
    certificate_storage_path: Path = Path("./data/certificates")
    certificate_font_path: Path | None = None

    simulator_scenario: Literal[
        "instant", "delayed", "temporary_failure", "unknown", "terminated"
    ] = "instant"
    simulator_confirmation_delay_seconds: int = Field(default=2, ge=0, le=3600)

    chainmaker_chain_id: str | None = None
    chainmaker_org_id: str | None = None
    chainmaker_node_address: str | None = None
    chainmaker_tls_host_name: str | None = None
    chainmaker_trust_ca_paths: tuple[Path, ...] = ()
    chainmaker_sign_key_path: Path | None = None
    chainmaker_sign_cert_path: Path | None = None
    chainmaker_tls_key_path: Path | None = None
    chainmaker_tls_cert_path: Path | None = None
    chainmaker_contract_name: str = "educhain_evidence"
    chainmaker_submit_method: str = "SaveEvidence"
    chainmaker_query_method: str = "GetEvidence"
    chainmaker_submit_timeout_seconds: int = Field(default=5, ge=1, le=60)
    chainmaker_query_timeout_seconds: int = Field(default=3, ge=1, le=60)

    @model_validator(mode="after")
    def validate_chainmaker_configuration(self) -> "Settings":
        if self.deployment_environment == "production-like" and self.mode == "simulator":
            raise ValueError("The simulator is not allowed in the production-like environment")
        if self.mode != "chainmaker":
            return self
        required = {
            "chainmaker_chain_id": self.chainmaker_chain_id,
            "chainmaker_org_id": self.chainmaker_org_id,
            "chainmaker_node_address": self.chainmaker_node_address,
            "chainmaker_tls_host_name": self.chainmaker_tls_host_name,
            "chainmaker_sign_key_path": self.chainmaker_sign_key_path,
            "chainmaker_sign_cert_path": self.chainmaker_sign_cert_path,
            "chainmaker_tls_key_path": self.chainmaker_tls_key_path,
            "chainmaker_tls_cert_path": self.chainmaker_tls_cert_path,
        }
        missing = [name for name, value in required.items() if value is None]
        if not self.chainmaker_trust_ca_paths:
            missing.append("chainmaker_trust_ca_paths")
        if missing:
            raise ValueError(f"Missing ChainMaker configuration: {', '.join(sorted(missing))}")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
