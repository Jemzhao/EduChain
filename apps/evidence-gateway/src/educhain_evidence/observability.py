import json
import logging
from collections import Counter
from datetime import UTC, datetime
from threading import Lock
from typing import Any


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for field in (
            "service",
            "environment",
            "version",
            "request_id",
            "method",
            "route",
            "status_code",
            "duration_ms",
            "error_class",
            "field_errors",
        ):
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)


class OperationalMetrics:
    def __init__(self) -> None:
        self._lock = Lock()
        self._requests: Counter[tuple[str, str, int]] = Counter()
        self._duration_seconds: dict[tuple[str, str], float] = {}

    def observe(self, method: str, route: str, status_code: int, duration_seconds: float) -> None:
        with self._lock:
            self._requests[(method, route, status_code)] += 1
            key = (method, route)
            self._duration_seconds[key] = self._duration_seconds.get(key, 0.0) + duration_seconds

    def render(self) -> str:
        lines = [
            "# HELP educhain_evidence_http_requests_total Completed HTTP requests.",
            "# TYPE educhain_evidence_http_requests_total counter",
        ]
        with self._lock:
            for (method, route, status), value in sorted(self._requests.items()):
                labels = f'method="{method}",route="{route}",status="{status}"'
                lines.append(f"educhain_evidence_http_requests_total{{{labels}}} {value}")
            lines.extend(
                [
                    "# HELP educhain_evidence_http_request_duration_seconds_sum "
                    "Total request duration.",
                    "# TYPE educhain_evidence_http_request_duration_seconds_sum counter",
                ]
            )
            for (method, route), duration_value in sorted(self._duration_seconds.items()):
                labels = f'method="{method}",route="{route}"'
                lines.append(
                    "educhain_evidence_http_request_duration_seconds_sum"
                    f"{{{labels}}} {duration_value:.6f}"
                )
        return "\n".join(lines) + "\n"


operational_metrics = OperationalMetrics()
