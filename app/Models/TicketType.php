<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketType extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'name',
        'description',
        'quota',
        'sale_start',
        'sale_end',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'quota' => 'integer',
            'sale_start' => 'datetime',
            'sale_end' => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(TicketPrice::class);
    }

    public function activePrice()
    {
        return $this->hasOne(TicketPrice::class)->where('status', 'ACTIVE')->latest();
    }
}
