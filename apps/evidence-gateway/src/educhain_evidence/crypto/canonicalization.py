import json
from collections.abc import Mapping, Sequence

type JsonScalar = str | int | float | bool | None
type JsonValue = JsonScalar | Mapping[str, JsonValue] | Sequence[JsonValue]


def canonicalize_json(value: JsonValue) -> bytes:
    """Return deterministic UTF-8 JSON bytes for evidence payload hashing."""
    serialized = json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    )
    return serialized.encode("utf-8")
