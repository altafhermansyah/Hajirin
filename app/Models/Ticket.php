<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Ticket extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'order_item_id',
        'ticket_code',
        'attendee_name',
        'attendee_email',
        'attendee_phone',
        'status',
        'checked_in_at',
        'checked_in_by',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function checkedInByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }

    public function event(): HasOneThrough
    {
        return $this->hasOneThrough(
            Event::class,
            Order::class,
            'id', // Foreign key on orders table (orders.id)
            'id', // Foreign key on events table (events.id)
            'order_id', // Local key on tickets table (tickets.order_id)
            'event_id' // Local key on orders table (orders.event_id)
        );
    }
}
