from collections.abc import Collection

from authlib.jose.rfc7517 import Key

class KeySet:
    keys: Collection[Key]
    def __init__(self, keys) -> None: ...
    def as_dict(self, is_private: bool = False, **params): ...
    def as_json(self, is_private: bool = False, **params): ...
    def find_by_kid(self, kid): ...
