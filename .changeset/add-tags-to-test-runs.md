---
'@smooai/testing': minor
---

Add tags support to test runs. Tags are flexible string arrays (e.g., `['e2e', 'brent-rager']`) for categorizing runs by type and scope. Added `--tags` CLI option to `create`, `report`, and `list` commands. Updated `SmooTestingClient.report()` to accept tags.
