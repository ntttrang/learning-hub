# DP-800 lab Docker environment

This directory is the donor app's local lab environment, copied verbatim by
the pack extractor (`npm run content:extract-dp800`). It stands up one
container per database engine plus Data API builder so the hands-on labs can
run anywhere Docker does.

## Read this before `docker compose up`

- The compose file, seed SQL, and `dab-config.json` bake in lab-local
  development credentials in plain text. The donor publishes them by design so
  the labs are copy-paste runnable. Treat them as throwaway dev values and
  change them before any shared or persistent deployment.
- `dab-config.json` configures no authentication (anonymous access) and runs
  in development host mode.
- Container ports are published on all interfaces. For local-only use, edit
  the compose file to bind each published port to `127.0.0.1`
  (`"127.0.0.1:1433:1433"` style) before starting the stack.
- `seed/mssql/AdventureWorksLT2025.bak` (~1.7 MB) restores the sample
  database the labs query.
