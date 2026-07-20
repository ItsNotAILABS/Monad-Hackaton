from thesis_forge.cli import _engine, _pairs, parser


def test_engine_defaults_to_public_gateway():
    assert _engine("https://example.com/", "") == "https://example.com/engine"
    assert _engine("https://example.com", "http://127.0.0.1:8043/") == "http://127.0.0.1:8043"


def test_pair_parser_supports_balances():
    assert _pairs(["MON=1.25"], numbers=True) == {"MON": 1.25}


def test_wallet_link_command_parses_governed_identity():
    args = parser().parse_args([
        "wallets", "link", "0x" + "1" * 40,
        "--kind", "safe",
        "--role", "treasury",
        "--namespace", "company",
        "--policy-profile", "multisig-required",
        "--balance", "MON=2.5",
    ])
    assert args.wallet_command == "link"
    assert args.kind == "safe"
    assert args.role == "treasury"
    assert args.namespace == "company"
