# This sample tests that type aliasing works.

from typing import Any, Literal

# Make sure it works with and without forward references.
TupleAlias = tuple["int", int]

v1: tuple[int, int]
v2: TupleAlias

v1 = (1, 2)
v2 = (1, 2)


AnyAlias = Any

v3: AnyAlias = 3


class A:
    Value1 = Literal[1]

    Value2 = 1


reveal_type(A.Value1, expected_text="type[Literal[1]]")
reveal_type(A.Value2, expected_text="int")


Alias1 = Literal[0, 1]

v4: dict[Alias1, Any] = {}

if v4:
    pass

v5: list[Alias1] = []


Alias2 = int | str


def func1(x: Alias2):
    reveal_type(type(x), expected_text="type[int] | type[str]")
