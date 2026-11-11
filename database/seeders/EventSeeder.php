<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Akun EO (Event Organizer)
        $eo = DB::table('users')->where('email', 'eo@techinnovation.com')->first();
        if (! $eo) {
            $eoId = Str::uuid()->toString();
            DB::table('users')->insert([
                'id' => $eoId,
                'name' => 'Tech Innovation Indonesia',
                'email' => 'eo@techinnovation.com',
                'password' => bcrypt('password'),
                'role' => 'EO',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $eoId = $eo->id;
        }

        $eoKreator = DB::table('users')->where('email', 'eo@kreatornusantara.com')->first();
        if (! $eoKreator) {
            $eoKreatorId = Str::uuid()->toString();
            DB::table('users')->insert([
                'id' => $eoKreatorId,
                'name' => 'Kreator Nusantara Live',
                'email' => 'eo@kreatornusantara.com',
                'password' => bcrypt('password'),
                'role' => 'EO',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $eoKreatorId = $eoKreator->id;
        }

        $categories = DB::table('categories')->pluck('id', 'slug');

        $eventsData = [
            [
                'eo_id' => $eoId,
                'category_id' => $categories['seminar'] ?? 1,
                'title' => 'Indonesia Tech Conference 2026: The Future of AI & Engineering',
                'slug' => 'indonesia-tech-conference-2026',
                'description' => "Indonesia Tech Conference 2026 adalah konferensi teknologi tahunan terbesar yang menyatukan lebih dari 500 praktisi software engineering, arsitek cloud, peneliti AI, dan pemimpin industri teknologi terkemuka.\n\nHighlight Acara:\n• Keynote speech eksklusif mengenai penerapan Large Language Model di ekosistem enterprise.\n• Panel diskusi interaktif bersama para tech lead startup unicorn.\n• Hands-on workshop arsitektur scalable cloud & DevOps.\n• Sesi networking berjejaring bersama komunitas talenta digital dan investor.",
                'event_type' => 'OFFLINE',
                'venue_name' => 'ICE BSD Hall 1, Tangerang',
                'address' => 'Jl. BSD Grand Boulevard No.1, Pagedangan, Tangerang, Banten 15339',
                'online_url' => null,
                'starts_at' => '2026-10-24 09:00:00+07',
                'ends_at' => '2026-10-24 17:00:00+07',
                'banner_path' => '/images/events/tech_hero.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Presale 1 - Early Bird',
                        'desc' => 'Akses seluruh sesi keynote, area pameran teknologi, dan goodie bag terbatas.',
                        'quota' => 0,
                        'price' => 150000.00,
                    ],
                    [
                        'name' => 'Regular Admission',
                        'desc' => 'Akses penuh ke semua sesi keynote, hands-on workshop, coffee break, dan e-certificate.',
                        'quota' => 85,
                        'price' => 250000.00,
                    ],
                    [
                        'name' => 'VIP Experience Pass',
                        'desc' => 'Akses VIP lounge, reserved seat baris terdepan, lunch buffet bersama pembicara, dan merchandise eksklusif.',
                        'quota' => 20,
                        'price' => 650000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['workshop'] ?? 1,
                'title' => 'Creative Design & Typography Workshop 2026',
                'slug' => 'creative-design-typography-workshop-2026',
                'description' => "Eksplorasi estetika tipografi modern dan visual identity branding bersama para desainer grafis ternama di Indonesia.\n\nYang dipelajari:\n• Konstruksi huruf dan grid system tipografi profesional.\n• Eksperimen tipografi kinetik untuk UI/UX & media digital.\n• Mentoring portfolio langsung dari creative director agency global.",
                'event_type' => 'OFFLINE',
                'venue_name' => 'Margo City Convention Hall, Bandung',
                'address' => 'Jl. Margonda No. 358, Sukajadi, Bandung, Jawa Barat',
                'online_url' => null,
                'starts_at' => '2026-10-25 10:00:00+07',
                'ends_at' => '2026-10-25 16:30:00+07',
                'banner_path' => '/images/events/design_hero.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Standard Workshop Pass',
                        'desc' => 'Termasuk toolkit desain fisik, workbook, dan e-sertifikat kompetensi.',
                        'quota' => 45,
                        'price' => 50000.00,
                    ],
                    [
                        'name' => 'Masterclass + Portfolio Review',
                        'desc' => 'Sesi review portfolio 1-on-1 dengan creative director dan sertifikat bertanda tangan khusus.',
                        'quota' => 15,
                        'price' => 125000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['olahraga'] ?? 1,
                'title' => 'Jakarta Sunrise Marathon 2026: Run for Green Planet',
                'slug' => 'jakarta-sunrise-marathon-2026',
                'description' => "Rasakan sensasi berlari menyambut fajar di jalanan protokol ibu kota Jakarta tanpa polusi. Setiap kilometer yang ditempuh akan didonasikan untuk penanaman pohon mangrove di pesisir utara pulau Jawa.\n\nKategori Lari:\n• 5K Fun Run\n• 10K Challenge\n• 21K Half Marathon",
                'event_type' => 'OFFLINE',
                'venue_name' => 'Plaza FX Sudirman, Jakarta',
                'address' => 'Jl. Jenderal Sudirman Pintu Satu Senayan, Gelora, Jakarta Pusat',
                'online_url' => null,
                'starts_at' => '2026-11-01 05:30:00+07',
                'ends_at' => '2026-11-01 10:00:00+07',
                'banner_path' => '/images/events/marathon_hero.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => '5K Fun Run Entry',
                        'desc' => 'Termasuk jersey resmi dry-fit, bib number, medali finisher, dan refreshment.',
                        'quota' => 150,
                        'price' => 125000.00,
                    ],
                    [
                        'name' => '10K Challenge Entry',
                        'desc' => 'Termasuk timing chip RFID, jersey finisher, medali metal, dan paket asuransi.',
                        'quota' => 80,
                        'price' => 200000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['musik'] ?? 1,
                'title' => 'Soundscapes Indie & Electronic Music Night',
                'slug' => 'soundscapes-indie-electronic-music-night',
                'description' => 'Malam perayaan musik indie dan beat elektronik di bawah gemerlap tata cahaya visual interaktif. Menghadirkan deretan musisi indie paling bersinar tahun ini di panggung outdoor.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Campus Center Amphitheater, Jakarta',
                'address' => 'Komplek UI Salemba, Jakarta Pusat, DKI Jakarta',
                'online_url' => null,
                'starts_at' => '2026-11-30 16:00:00+07',
                'ends_at' => '2026-11-30 23:00:00+07',
                'banner_path' => '/images/events/soundscapes.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'General Admission',
                        'desc' => 'Akses masuk panggung utama, free drink 1 voucher, dan glow wristband.',
                        'quota' => 200,
                        'price' => 85000.00,
                    ],
                    [
                        'name' => 'Front Row VIP Pass',
                        'desc' => 'Akses area depan panggung (moshpit), free merchandise kaos official, dan VIP bar.',
                        'quota' => 40,
                        'price' => 175000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoId,
                'category_id' => $categories['festival'] ?? 1,
                'title' => 'Festival Musik Nusantara 2026',
                'slug' => 'festival-musik-nusantara-2026',
                'description' => 'Dimeriahkan oleh lebih dari 50 musisi lokal ternama di 3 panggung megah. Perpaduan harmonis alunan tradisional nusantara dan aransemen pop modern.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Stadion Madya GBK, Senayan, Jakarta',
                'address' => 'Gelora Bung Karno Sport Complex, Senayan, Jakarta Pusat',
                'online_url' => null,
                'starts_at' => '2026-10-18 13:00:00+07',
                'ends_at' => '2026-10-18 23:00:00+07',
                'banner_path' => '/images/events/hero_festival.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Festival Reguler (1-Day Pass)',
                        'desc' => 'Akses ke 3 panggung konser dan area pasar kuliner nusantara.',
                        'quota' => 300,
                        'price' => 75000.00,
                    ],
                    [
                        'name' => 'VIP Tribune (Numbered Seat)',
                        'desc' => 'Kursi tribun beratap terbaik, welcome drink, dan akses gate prioritas tanpa antre.',
                        'quota' => 60,
                        'price' => 180000.00,
                    ],
                ],
            ],
        ];

        foreach ($eventsData as $data) {
            $tickets = $data['tickets'];
            unset($data['tickets']);

            $existing = DB::table('events')->where('slug', $data['slug'])->first();
            if ($existing) {
                $eventId = $existing->id;
                DB::table('events')->where('id', $eventId)->update(array_merge($data, ['updated_at' => $now]));
            } else {
                $eventId = Str::uuid()->toString();
                DB::table('events')->insert(array_merge($data, [
                    'id' => $eventId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]));
            }

            foreach ($tickets as $tick) {
                $existingTicket = DB::table('ticket_types')
                    ->where('event_id', $eventId)
                    ->where('name', $tick['name'])
                    ->first();

                if ($existingTicket) {
                    $ticketTypeId = $existingTicket->id;
                    DB::table('ticket_types')->where('id', $ticketTypeId)->update([
                        'description' => $tick['desc'],
                        'quota' => $tick['quota'],
                        'status' => 'ACTIVE',
                        'updated_at' => $now,
                    ]);
                } else {
                    $ticketTypeId = Str::uuid()->toString();
                    DB::table('ticket_types')->insert([
                        'id' => $ticketTypeId,
                        'event_id' => $eventId,
                        'name' => $tick['name'],
                        'description' => $tick['desc'],
                        'quota' => $tick['quota'],
                        'status' => 'ACTIVE',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                $existingPrice = DB::table('ticket_prices')
                    ->where('ticket_type_id', $ticketTypeId)
                    ->first();

                if ($existingPrice) {
                    DB::table('ticket_prices')->where('id', $existingPrice->id)->update([
                        'price' => $tick['price'],
                        'status' => 'ACTIVE',
                        'updated_at' => $now,
                    ]);
                } else {
                    DB::table('ticket_prices')->insert([
                        'id' => Str::uuid()->toString(),
                        'ticket_type_id' => $ticketTypeId,
                        'name' => 'Harga Resmi',
                        'price' => $tick['price'],
                        'status' => 'ACTIVE',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }
}
