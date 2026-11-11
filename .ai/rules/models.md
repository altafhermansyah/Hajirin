# Eloquent Model Rules

## UUID Primary Keys on Domain Models
Use the `HasUuids` trait on all domain models except integer lookup tables like `Category`.

## Explicit Fillable Property
Declare mass-assignable attributes using the `protected $fillable = [...]` property on every model. Never use `$guarded = []` or include privilege/moderation columns (`role`, `status`, `reviewed_by`) in `$fillable`.
