import re
import unicodedata

def remove_acentos(text: str) -> str:
    if not text:
        return ""
    return "".join(
        c for c in unicodedata.normalize("NFKD", str(text))
        if not unicodedata.combining(c)
    )

def clean_text(value) -> str:
    if value is None:
        return ""
    s = str(value).strip()
    s = re.sub(r"\s{2,}", " ", s)
    s = s.replace("\uFFFD", "").replace("ï¿½", "")
    s = remove_acentos(s)
    return s

def safe_filename(name: str) -> str:
    return re.sub(r"[^\w.-]+", "_", name or "arquivo")

def normalize_header(s) -> str:
    if s is None:
        return ""
    s = str(s).strip().lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"\s+", " ", s)
    return s

def find_column_index(candidates, headers_norm):
    if isinstance(candidates, str):
        candidates = [candidates]
    for cand in candidates:
        key = normalize_header(cand)
        if key in headers_norm:
            return headers_norm.index(key)
    return None
