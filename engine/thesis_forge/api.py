from fastapi import FastAPI
from .atlas import PROTOCOLS
from .compiler import compile_manifest
from .models import Action, BuildRequest, Policy
from .policy import arbitrate
from .receipts import seal

app = FastAPI(title="THESIS Forge API", version="0.1.0")

@app.get("/health")
def health():
    return {"status": "operational", "network": "Monad", "engines": 11}

@app.get("/protocols")
def protocols():
    return [p.model_dump(mode="json") for p in PROTOCOLS]

@app.post("/forge")
def forge(request: BuildRequest):
    manifest = compile_manifest(request)
    receipt = seal("build-manifest", manifest.model_dump(mode="json"))
    return {"manifest": manifest, "receipt": receipt}

@app.post("/arena")
def arena(actions: list[Action], policy: Policy):
    evaluated, winner = arbitrate(actions, policy)
    return {
        "evaluations": [{"action": a, "evaluation": e} for a, e in evaluated],
        "winner": {"action": winner[0], "evaluation": winner[1]} if winner else None,
    }
