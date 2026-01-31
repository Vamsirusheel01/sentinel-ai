# sentinel_agent/utils/hash_utils.py

import hashlib


def sha256_file(path, chunk_size=8192):
    try:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(chunk_size):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


def sha256_string(data: str):
    return hashlib.sha256(data.encode()).hexdigest()