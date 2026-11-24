<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    public const USER = 'USER';

    public const EO = 'EO';

    public const ADMIN = 'ADMIN';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'description',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public static function idForCode(string $code): ?int
    {
        $id = self::query()
            ->where('code', strtoupper($code))
            ->value('id');

        return $id !== null ? (int) $id : null;
    }
}
