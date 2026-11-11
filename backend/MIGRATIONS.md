# Database migrations

The application schema is managed with Alembic. Do not run `Base.metadata.create_all()` against an existing database or use `alembic upgrade head` on an existing, unversioned database before stamping its verified baseline. The adopted baseline is intentionally irreversible because downgrading it would drop the legacy application tables.

## Existing database

1. Stop application processes that write to the database.
2. Make a SQLite backup and verify it with `PRAGMA integrity_check` and table row counts.
3. Confirm the database schema matches the `0001_legacy_baseline` revision.
4. From the `backend` directory, run `python -m alembic stamp 0001_legacy_baseline`. Stamping records the baseline in `alembic_version` without changing application tables or rows.
5. Apply subsequent revisions with `python -m alembic upgrade head`.

## New database

From the `backend` directory, run `python -m alembic upgrade head` to create the schema from the migration history.

Review every generated migration before applying it, especially SQLite table rebuild operations. The authentication migration leaves legacy resources with `user_id = NULL`; those rows are preserved and are never assigned automatically. Revision `0003_session_options` adds non-null setup metadata with defaults to existing sessions without changing their owners, questions, or answers. Auth and session-option revisions are forward-only to avoid deleting account, session, or ownership data.

Keep verified backups outside the repository and never commit local `.env` files or database backups.

## Authentication configuration

Set `JWT_SECRET` to a unique random value of at least 32 characters before starting the API. For local HTTP development, `AUTH_COOKIE_SECURE=false` is required; set it to `true` in production and serve the frontend/API over HTTPS. Keep `AUTH_COOKIE_SAMESITE=strict` unless the deployment topology requires a reviewed alternative. Never commit the configured `.env` file.
