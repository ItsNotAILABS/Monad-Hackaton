from pathlib import Path

import thesis_forge.wallet_identity as wallets


def setup_function():
    wallets._PATH = Path("/tmp/thesis-wallet-identities-test.json")
    wallets._PATH.unlink(missing_ok=True)


def test_chain_aliases_are_caip2():
    assert wallets.normalize_chain("monad-testnet") == "eip155:10143"
    assert wallets.normalize_chain("143") == "eip155:143"


def test_register_deduplicates_public_identity():
    address = "0x" + "1" * 40
    first = wallets.register({"kind": "metamask", "address": address, "role": "operator"})
    second = wallets.register({"kind": "metamask", "address": address, "role": "treasury"})
    assert first.wallet_id == second.wallet_id
    assert second.role == "treasury"
    assert wallets.snapshot()["total"] == 1


def test_secret_material_is_rejected():
    address = "0x" + "2" * 40
    try:
        wallets.register({"kind": "metamask", "address": address, "metadata": {"private_key": "forbidden"}})
    except ValueError as exc:
        assert "secret material" in str(exc)
    else:
        raise AssertionError("secret material was accepted")


def test_safe_and_institutional_profiles():
    safe = wallets.register({"kind": "safe", "address": "0x" + "3" * 40, "role": "treasury"})
    fireblocks = wallets.register({"kind": "fireblocks", "address": "0x" + "4" * 40, "role": "deployer"})
    assert safe.custody == "multisig"
    assert "multisig" in safe.capabilities
    assert fireblocks.custody == "institutional"


def test_architecture_covers_major_wallet_systems():
    kinds = {item["kind"] for item in wallets.architecture()["adapters"]}
    assert {"metamask", "phantom", "walletconnect", "safe", "ledger", "privy", "turnkey", "fireblocks"} <= kinds
