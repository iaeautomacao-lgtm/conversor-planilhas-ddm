from abc import ABC, abstractmethod
from ..utils.text import normalize_header, find_column_index

class BaseTransformer(ABC):
    def __init__(self, institution_id: str, name: str):
        self.institution_id = institution_id
        self.name = name

    def get_value(self, row: dict, col_name, headers_norm: list):
        idx = find_column_index(col_name, headers_norm)
        if idx is not None:
            keys = list(row.keys())
            if idx < len(keys):
                return row.get(keys[idx], "")
        return ""

    @abstractmethod
    def transform(self, raw_rows: list, headers: list) -> list:
        pass
