# Testing Rules

## PHPUnit Inertia Feature Tests with Seeder Fixtures
Write PHPUnit feature tests in `tests/Feature/` using `RefreshDatabase`, `User::factory()` for user fixtures, `$this->seed(CategorySeeder::class)` and `$this->seed(EventSeeder::class)` in `setUp()` for catalog tests, and `AssertableInertia as Assert` for Inertia page assertions.
