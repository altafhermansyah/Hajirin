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
            ['name' => 'Musik', 'slug' => 'musik', 'icon' => 'headphones', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Seminar', 'slug' => 'seminar', 'icon' => 'users', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Workshop', 'slug' => 'workshop', 'icon' => 'palette', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Olahraga', 'slug' => 'olahraga', 'icon' => 'volleyball', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Komunitas', 'slug' => 'komunitas', 'icon' => 'user-round', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Festival', 'slug' => 'festival', 'icon' => 'tent-tree', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Pameran', 'slug' => 'pameran', 'icon' => 'layout-grid', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Lainnya', 'slug' => 'lainnya', 'icon' => 'menu', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('categories')->upsert($categories, ['slug'], ['name', 'icon', 'updated_at']);
    }
}
