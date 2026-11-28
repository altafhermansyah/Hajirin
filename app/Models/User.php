<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids, Notifiable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar_path',
        'password',
        'role',
        'status',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'broadcast_emails_enabled' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /**
     * Sinkronkan relasi tabel roles (role_id) dengan kolom role saat menyimpan user.
     */
    protected static function booted(): void
    {
        static::saving(function (User $user): void {
            if ($user->isDirty('role_id') && ! $user->isDirty('role') && $user->role_id !== null) {
                $roleCode = Role::query()->whereKey($user->role_id)->value('code');

                if ($roleCode !== null) {
                    $user->role = $roleCode;
                    $user->unsetRelation('roleRecord');
                }

                return;
            }

            $roleCode = strtoupper((string) ($user->role ?: Role::USER));
            $user->role = $roleCode;

            if ($user->role_id === null || $user->isDirty('role')) {
                $roleId = Role::idForCode($roleCode);

                if ($roleId !== null) {
                    $user->role_id = $roleId;
                    $user->unsetRelation('roleRecord');
                }
            }
        });
    }

    public function roleRecord(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'eo_id');
    }

    public function eoApplications(): HasMany
    {
        return $this->hasMany(EoApplication::class);
    }

    public function eventStaffAssignments(): HasMany
    {
        return $this->hasMany(EventStaff::class);
    }

    public function tickets(): HasManyThrough
    {
        return $this->hasManyThrough(Ticket::class, Order::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    public function bookmarkedEvents(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'bookmarks', 'user_id', 'event_id')->withTimestamps();
    }

    public function hasRole(string $code): bool
    {
        if ($this->relationLoaded('roleRecord')) {
            return strtoupper((string) $this->roleRecord?->code) === strtoupper($code);
        }

        if (filled($this->role)) {
            return strtoupper((string) $this->role) === strtoupper($code);
        }

        return strtoupper((string) $this->roleRecord?->code) === strtoupper($code);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(Role::ADMIN);
    }

    public function isEo(): bool
    {
        return $this->hasRole(Role::EO);
    }

    public function isUser(): bool
    {
        return $this->hasRole(Role::USER);
    }

    public function isActive(): bool
    {
        return ($this->status ?? 'ACTIVE') === 'ACTIVE';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'SUSPENDED';
    }
}
