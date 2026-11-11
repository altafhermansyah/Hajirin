# HTTP, Controllers, and Validation Rules

## Direct Controller Queries and Logic
Write database queries, transactions, and Inertia prop formatting directly in controller methods. Do not introduce Action, Service, Repository, or DTO layers.

## Database Query Style in Controllers
Use Eloquent models for write operations, row locking (`lockForUpdate()`), and single-entity lookups. Use `DB::table()` for read-heavy multi-table joins and conditional aggregate dashboard queries.

## Form Request Validation
Validate incoming `POST`, `PUT`, and `PATCH` requests using dedicated `FormRequest` classes in `app/Http/Requests/` with custom validation messages in Bahasa Indonesia.

## Inline Bahasa Indonesia Copy and Formatting
Write all user-facing messages and validation errors directly in Bahasa Indonesia without translation files. Format dates with `Carbon::parse($date)->locale('id')->translatedFormat(...)` and Rupiah currency with `'Rp'.number_format($amount, 0, ',', '.')`.
