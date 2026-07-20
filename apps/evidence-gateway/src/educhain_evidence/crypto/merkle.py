from collections.abc import Sequence
from hashlib import sha256


def merkle_root_hex(leaves: Sequence[str]) -> str | None:
    """Build a binary SHA-256 tree from ordered hexadecimal leaf digests."""
    if not leaves:
        return None

    level = [bytes.fromhex(leaf) for leaf in leaves]
    if any(len(item) != 32 for item in level):
        raise ValueError("Every Merkle leaf must be a SHA-256 hexadecimal digest.")

    while len(level) > 1:
        if len(level) % 2 == 1:
            level.append(level[-1])
        level = [
            sha256(level[index] + level[index + 1]).digest() for index in range(0, len(level), 2)
        ]

    return level[0].hex()
