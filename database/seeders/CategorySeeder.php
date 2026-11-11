<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $categories = [
            ['name' => 'Musik', 'slug' => 'musik', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Seminar', 'slug' => 'seminar', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Workshop', 'slug' => 'workshop', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Olahraga', 'slug' => 'olahraga', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Komunitas', 'slug' => 'komunitas', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Festival', 'slug' => 'festival', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Pameran', 'slug' => 'pameran', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Lainnya', 'slug' => 'lainnya', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('categories')->upsert($categories, ['slug'], ['name', 'updated_at']);
    }
}
