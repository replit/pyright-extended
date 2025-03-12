from collections.abc import Iterable
from typing import TypeVar

_T = TypeVar("_T")

class IndexedList(list[_T]):
    clean: bool
    def __init__(self, iterable: Iterable[_T] | None = None) -> None: ...
    def __contains__(self, value: object) -> bool: ...
    def index(self, value: _T) -> int: ...  # type: ignore[override]
    def append(self, value: _T) -> None: ...
    def add(self, value: _T) -> int: ...
