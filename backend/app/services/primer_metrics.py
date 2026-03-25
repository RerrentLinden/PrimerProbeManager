SEQUENCE_CHARS = frozenset("ATCGatcg")
GC_CHARS = frozenset("GCgc")


def count_bases(sequence: str) -> int:
    return sum(1 for char in sequence if char in SEQUENCE_CHARS)


def calculate_gc_percent(sequence: str) -> float | None:
    base_count = count_bases(sequence)
    if base_count == 0:
        return None
    gc_count = sum(1 for char in sequence if char in GC_CHARS)
    return gc_count / base_count
