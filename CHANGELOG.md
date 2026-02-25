# @smooai/testing

## 1.1.0

### Minor Changes

- 33a6b6d: Add tags support to test runs. Tags are flexible string arrays (e.g., `['e2e', 'brent-rager']`) for categorizing runs by type and scope. Added `--tags` CLI option to `create`, `report`, and `list` commands. Updated `SmooTestingClient.report()` to accept tags.

## 1.0.1

### Patch Changes

- 17d5122: Fix release workflow race condition and pre-commit-check circular reference

## 1.0.0

### Major Changes

- 817b21c: Initial public release of @smooai/testing SDK. Includes SmooTestingClient library and CLI for managing test runs, cases, environments, and deployments via the Smoo AI Testing API.
