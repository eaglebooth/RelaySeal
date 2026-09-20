import os

import pytest


@pytest.fixture(autouse=True)
def tolerate_windows_gltest_tempfile_lock(monkeypatch):
    """gltest unlinks an fd-backed tempfile before Windows releases it."""
    real_unlink = os.unlink

    def unlink(path, *args, **kwargs):
        try:
            return real_unlink(path, *args, **kwargs)
        except PermissionError:
            if str(path).lower().endswith(".py"):
                raise
            return None

    monkeypatch.setattr(os, "unlink", unlink)
