from hashlib import sha256
import json

def seal(kind: str, payload: dict, previous_hash: str = "0" * 64) -> dict:
    body = {"kind": kind, "payload": payload, "previous_hash": previous_hash}
    receipt_hash = sha256(json.dumps(body, sort_keys=True, default=str).encode()).hexdigest()
    return {**body, "receipt_hash": receipt_hash}
