<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
    ];
}
