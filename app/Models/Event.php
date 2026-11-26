<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Event extends Model
{
    use HasFactory, HasUuids;

    /**
     * Jumlah jam sebelum waktu mulai acara saat gerbang check-in mulai dibuka.
     */
    public const int CHECKIN_OPEN_HOURS_BEFORE = 3;

    protected $fillable = [
        'eo_id',
        'category_id',
        'title',
        'slug',
        'description',
        'terms_and_conditions',
        'event_type',
        'city',
        'venue_name',
        'address',
        'online_url',
        'starts_at',
        'ends_at',
        'banner_path',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'eo_id');
    }

    public function eo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'eo_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function ticketTypes(): HasMany
    {
        return $this->hasMany(TicketType::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function tickets(): HasManyThrough
    {
        return $this->hasManyThrough(Ticket::class, Order::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(EventStaff::class);
    }

    /**
     * Waktu pembukaan gerbang check-in (3 jam sebelum acara dimulai).
     */
    public function checkInOpensAt(): Carbon
    {
        return Carbon::parse($this->starts_at)
            ->timezone(config('app.timezone'))
            ->subHours(self::CHECKIN_OPEN_HOURS_BEFORE);
    }

    /**
     * Batas waktu penutupan check-in (saat acara berakhir).
     */
    public function checkInClosesAt(): Carbon
    {
        return Carbon::parse($this->ends_at)
            ->timezone(config('app.timezone'));
    }

    /**
     * Periksa apakah check-in untuk acara ini sedang dibuka pada waktu tertentu.
     */
    public function isCheckInOpen(?Carbon $at = null): bool
    {
        $now = ($at ?? now())->copy()->timezone(config('app.timezone'));

        return $now->greaterThanOrEqualTo($this->checkInOpensAt())
            && $now->lessThanOrEqualTo($this->checkInClosesAt());
    }

    /**
     * Kembalikan pesan penolakan check-in bila di luar jendela validasi Hari-H, atau null bila valid.
     */
    public function checkInWindowError(?Carbon $at = null): ?string
    {
        $now = ($at ?? now())->copy()->timezone(config('app.timezone'));
        $opensAt = $this->checkInOpensAt();
        $closesAt = $this->checkInClosesAt();

        if ($now->lessThan($opensAt)) {
            $opensAtFormatted = $opensAt->copy()->locale('id')->translatedFormat('d M Y, H:i').' WIB';

            return "Gerbang check-in belum dibuka. Check-in baru dapat dilakukan mulai {$opensAtFormatted} (".self::CHECKIN_OPEN_HOURS_BEFORE.' jam sebelum acara dimulai).';
        }

        if ($now->greaterThan($closesAt)) {
            $closesAtFormatted = $closesAt->copy()->locale('id')->translatedFormat('d M Y, H:i').' WIB';

            return "Waktu check-in untuk event ini telah berakhir pada {$closesAtFormatted}.";
        }

        return null;
    }
}
