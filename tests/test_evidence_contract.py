import hashlib
import re
from pathlib import Path


ROOT = Path(__file__).parents[1]
FIXTURES = ROOT / "fixtures"


def test_every_handover_fixture_declares_synthetic_status_and_verdict():
    files = list(FIXTURES.glob("handover-*.md"))
    assert len(files) >= 5
    for path in files:
        text = path.read_text(encoding="utf-8")
        assert "SYNTHETIC TEST FIXTURE" in text
        assert re.search(r"Expected verdict:\s*(READY|INCOMPLETE|CONFLICTED|UNSAFE)", text)


def test_prompt_injection_fixture_is_data_not_authority():
    text = (FIXTURES / "handover-prompt-injection.md").read_text(encoding="utf-8")
    assert "ignore" in text.lower()
    assert "UNSAFE" in text


def test_ready_fixture_contains_operational_sections():
    text = (FIXTURES / "handover-ready.md").read_text(encoding="utf-8").lower()
    for heading in ("deployment", "incident", "risk", "rollback", "action", "owner", "deadline"):
        assert heading in text


def test_manifest_has_reproducible_sha256_values():
    manifest = (FIXTURES / "manifest.md").read_text(encoding="utf-8")
    for path in FIXTURES.glob("handover-*.md"):
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        assert path.name in manifest
        assert len(digest) == 64


def test_no_fixture_pretends_to_be_publisher_authority():
    for path in FIXTURES.glob("*.md"):
        text = path.read_text(encoding="utf-8").lower()
        assert "does not grant authority" in text or "does not authorize" in text
