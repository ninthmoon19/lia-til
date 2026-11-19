"""Launch Path storage: the per-day results go into daily_logs as one section
(written without disturbing the rest of the day), and the plan's ticks and
settings are one small document behind the master secret."""

from fastapi.testclient import TestClient

import main

ADMIN = {"x-admin-secret": "test-admin-secret"}
SCOPED = {"x-admin-secret": "test-daily-secret"}
client = TestClient(main.app)

SETTINGS = {"start": "2026-11-18", "days": [14, 14, 14, 17], "hours": 6, "dayStart": "09:00", "dailyNew": 4, "goal": 220}


def put_section(date, heading, content, headers=ADMIN):
    return client.put(f"/api/daily-log/{date}/section", json={"heading": heading, "content": content}, headers=headers)


# ---- one-section upsert -------------------------------------------------------


def test_section_upsert_creates_a_private_only_day():
    r = put_section("2026-11-18", "Launch Path", "- New problems: 4")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["created"] is True
    assert body["week"] == "W47"
    assert body["sections"] == {"Launch Path": "- New problems: 4"}
    # A day holding only private sections never reaches the public timeline.
    assert client.get("/api/daily-log").json() == []


def test_section_upsert_keeps_the_rest_of_the_day():
    day = {"week": "W47", "done": ["Two Sum"], "summary": "Hashing day", "sections": {"Tech": "notes"}, "tags": ["code"]}
    assert client.put("/api/daily-log/2026-11-18", json=day, headers=ADMIN).status_code == 200

    put_section("2026-11-18", "Launch Path", "- New problems: 2")
    r = put_section("2026-11-18", "Launch Path", "- New problems: 5")
    assert r.json()["created"] is False

    stored = client.get("/api/daily-log/2026-11-18", headers=ADMIN).json()
    assert stored["sections"] == {"Tech": "notes", "Launch Path": "- New problems: 5"}
    assert stored["done"] == ["Two Sum"] and stored["summary"] == "Hashing day"
    # The curated public entry is unchanged and still has no sections.
    public = client.get("/api/daily-log").json()
    assert len(public) == 1 and "sections" not in public[0]
    assert public[0]["summary"] == "Hashing day"


def test_section_upsert_is_gated_and_validated():
    assert put_section("2026-11-18", "Launch Path", "x", headers={}).status_code == 401
    assert put_section("2026-11-18", "Launch Path", "x", headers=SCOPED).status_code == 200
    assert put_section("18-11-2026", "Launch Path", "x").status_code == 400
    assert put_section("2026-11-18", "", "x").status_code == 422


# ---- plan state ---------------------------------------------------------------


def test_launch_path_starts_empty():
    r = client.get("/api/launch-path", headers=ADMIN)
    assert r.status_code == 200
    assert r.json() == {"done": [], "settings": None, "updatedAt": None}


def test_settings_round_trip():
    r = client.patch("/api/launch-path", json={"settings": SETTINGS}, headers=ADMIN)
    assert r.status_code == 200, r.text
    got = client.get("/api/launch-path", headers=ADMIN).json()
    assert got["settings"] == SETTINGS
    assert got["updatedAt"]


def test_ticks_are_idempotent_and_independent():
    for body in (
        {"tick": {"id": "p1-py", "done": True}},
        {"tick": {"id": "p1-hash", "done": True}},
        {"tick": {"id": "p1-py", "done": True}},  # repeat: no duplicate
        {"tick": {"id": "p1-hash", "done": False}},
    ):
        assert client.patch("/api/launch-path", json=body, headers=ADMIN).status_code == 200
    assert client.get("/api/launch-path", headers=ADMIN).json()["done"] == ["p1-py"]

    # A settings write leaves the ticks alone.
    client.patch("/api/launch-path", json={"settings": SETTINGS}, headers=ADMIN)
    assert client.get("/api/launch-path", headers=ADMIN).json()["done"] == ["p1-py"]


def test_launch_path_is_master_only_and_validated():
    assert client.get("/api/launch-path", headers=SCOPED).status_code == 401
    assert client.patch("/api/launch-path", json={"tick": {"id": "p1-py", "done": True}}, headers=SCOPED).status_code == 401
    bad = [
        {**SETTINGS, "days": [14, 14, 14]},
        {**SETTINGS, "days": [0, 14, 14, 17]},
        {**SETTINGS, "hours": 20},
        {**SETTINGS, "start": "Nov 18"},
    ]
    for s in bad:
        assert client.patch("/api/launch-path", json={"settings": s}, headers=ADMIN).status_code == 422, s
    assert client.patch("/api/launch-path", json={"tick": {"id": "DROP TABLE", "done": True}}, headers=ADMIN).status_code == 422
