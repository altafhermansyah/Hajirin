# Database, Schema, and Seeder Rules

## Raw PostgreSQL Schema and Uppercase Enum Literals
Maintain domain tables, PostgreSQL `ENUM` types, constraints, and triggers in `database/schema/hajirin.sql` loaded via `DB::unprepared()`. Use uppercase string literals (e.g. `'USER'`, `'EO'`, `'ADMIN'`, `'PUBLISHED'`, `'PAID'`, `'ACTIVE'`) when querying or inserting PostgreSQL `ENUM` columns.

## UUID Primary Keys on Domain Tables
Use `UUID PRIMARY KEY DEFAULT uuidv7()` on domain tables in `database/schema/hajirin.sql`, except for reference lookup tables like `categories`.

## Idempotent Seeders
Write seeders in `database/seeders/` so they can be re-run safely using `upsert()` or `updateOrCreate()`.
