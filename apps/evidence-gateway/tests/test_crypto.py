from hashlib import sha256

import pytest

from educhain_evidence.crypto.canonicalization import canonicalize_json
from educhain_evidence.crypto.hashing import sha256_hex
from educhain_evidence.crypto.merkle import merkle_root_hex


def test_canonical_json_is_stable_and_unicode_safe() -> None:
    first = canonicalize_json({"课程": "数据结构", "meta": {"level": 2, "open": True}})
    second = canonicalize_json({"meta": {"open": True, "level": 2}, "课程": "数据结构"})

    assert first == second
    assert first == '{"meta":{"level":2,"open":true},"课程":"数据结构"}'.encode()
    assert sha256_hex(first) == sha256(first).hexdigest()


def test_merkle_root_handles_empty_single_even_and_odd_leaf_sets() -> None:
    leaves = [sha256(value.encode()).hexdigest() for value in ("a", "b", "c")]

    assert merkle_root_hex([]) is None
    assert merkle_root_hex([leaves[0]]) == leaves[0]

    expected_pair = sha256(bytes.fromhex(leaves[0]) + bytes.fromhex(leaves[1])).hexdigest()
    assert merkle_root_hex(leaves[:2]) == expected_pair

    left = bytes.fromhex(expected_pair)
    duplicated_right = sha256(bytes.fromhex(leaves[2]) * 2).digest()
    assert merkle_root_hex(leaves) == sha256(left + duplicated_right).hexdigest()


@pytest.mark.parametrize("invalid", [["abc"], ["gg" * 32]])
def test_merkle_root_rejects_invalid_sha256_leaves(invalid: list[str]) -> None:
    with pytest.raises(ValueError):
        merkle_root_hex(invalid)
