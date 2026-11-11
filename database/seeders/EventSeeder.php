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
            [
                'eo_id' => $eoId,
                'category_id' => $categories['seminar'] ?? 1,
                'title' => 'Startup Growth Festival 2026: Scale Up Beyond Boundaries',
                'slug' => 'startup-growth-festival-2026',
                'description' => 'Akselerasi bisnismu ke level berikutnya bersama para venture capital, unicorn founders, dan praktisi growth marketing terbaik di Asia Tenggara.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'JCC Senayan, Jakarta',
                'address' => 'Jl. Gatot Subroto, Senayan, Jakarta Pusat',
                'online_url' => null,
                'starts_at' => '2026-11-14 09:00:00+07',
                'ends_at' => '2026-11-15 17:00:00+07',
                'banner_path' => '/images/events/startup.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Founder Pass',
                        'desc' => 'Akses seluruh sesi konferensi, area pameran startup, dan sesi pitch deck.',
                        'quota' => 100,
                        'price' => 75000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['musik'] ?? 1,
                'title' => 'Nusantara Indie Soundwave: Special Showcase Vol. 4',
                'slug' => 'nusantara-indie-soundwave-vol-4',
                'description' => 'Showcase musik indie intim bersama band alternatif pilihan nusantara dengan tata suara akustik terbaik.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Bari Bintaro, Jakarta',
                'address' => 'Kawasan Komersial Bintaro, Jakarta Selatan',
                'online_url' => null,
                'starts_at' => '2026-11-21 18:30:00+07',
                'ends_at' => '2026-11-21 22:30:00+07',
                'banner_path' => '/images/events/nusantara-indie.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Showcase Pass',
                        'desc' => 'Akses masuk area showcase dan 1 minuman ringan.',
                        'quota' => 12,
                        'price' => 90000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoId,
                'category_id' => $categories['workshop'] ?? 1,
                'title' => 'AI Product Management: From LLM to Production',
                'slug' => 'ai-product-management-from-llm-to-production',
                'description' => 'Pelajari cara merancang, mengevaluasi, dan meluncurkan produk berbasis Large Language Model bersama praktisi AI Product Manager.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Cilandak Town Square, Jakarta',
                'address' => 'Jl. TB Simatupang Kav. 17, Cilandak, Jakarta Selatan',
                'online_url' => null,
                'starts_at' => '2026-11-28 09:30:00+07',
                'ends_at' => '2026-11-28 16:00:00+07',
                'banner_path' => '/images/events/ai-product.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Workshop Ticket',
                        'desc' => 'Termasuk modul studi kasus AI PM, makan siang, dan e-sertifikat.',
                        'quota' => 50,
                        'price' => 99000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['pameran'] ?? 1,
                'title' => 'Bandung Creative & Typography Showcase 2026',
                'slug' => 'bandung-creative-typography-showcase-2026',
                'description' => 'Pameran karya studio kreatif, instalasi tipografi eksperimental, dan pasar zine independen.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Margo City, Bandung',
                'address' => 'Jl. Ir. H. Juanda No. 120, Dago, Bandung',
                'online_url' => null,
                'starts_at' => '2026-12-05 10:00:00+07',
                'ends_at' => '2026-12-05 20:00:00+07',
                'banner_path' => '/images/events/bandung-creative.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Exhibition Entry',
                        'desc' => 'Akses penuh ke area pameran dan sesi artist talk.',
                        'quota' => 120,
                        'price' => 50000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoId,
                'category_id' => $categories['seminar'] ?? 1,
                'title' => 'FinTech Indonesia Leadership Summit 2026',
                'slug' => 'fintech-indonesia-leadership-summit-2026',
                'description' => 'Forum kepemimpinan industri teknologi finansial, regulasi pembayaran digital, dan keamanan siber perbankan.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Senayan, Jakarta',
                'address' => 'Kawasan Senayan, Jakarta Pusat',
                'online_url' => null,
                'starts_at' => '2026-10-21 14:00:00+07',
                'ends_at' => '2026-10-21 18:00:00+07',
                'banner_path' => '/images/events/startup.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Summit Delegate Pass',
                        'desc' => 'Akses konferensi utama dan networking lounge.',
                        'quota' => 75,
                        'price' => 200000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['festival'] ?? 1,
                'title' => 'Jakarta Art & Culture Installation Weekend',
                'slug' => 'jakarta-art-culture-installation-weekend',
                'description' => 'Pekan instalasi seni rupa kontemporer dan pertunjukan budaya kolaboratif di ruang bersejarah.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Museum Nasional, Jakarta',
                'address' => 'Jl. Medan Merdeka Barat No.12, Jakarta Pusat',
                'online_url' => null,
                'starts_at' => '2026-10-24 10:00:00+07',
                'ends_at' => '2026-10-24 18:00:00+07',
                'banner_path' => '/images/events/nusantara-indie.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Weekend Art Pass',
                        'desc' => 'Tiket masuk seluruh galeri instalasi dan tur kuratorial.',
                        'quota' => 90,
                        'price' => 45000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['pameran'] ?? 1,
                'title' => 'Indie Coffee & Culinary Expo',
                'slug' => 'indie-coffee-culinary-expo',
                'description' => 'Eksplorasi puluhan roastery kopi lokal, sesi cupping bersama barista juara, dan bazar kuliner nusantara.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'GBK Area, Jakarta Selatan',
                'address' => 'Gelora Bung Karno, Senayan, Jakarta Selatan',
                'online_url' => null,
                'starts_at' => '2026-10-24 15:00:00+07',
                'ends_at' => '2026-10-24 21:00:00+07',
                'banner_path' => '/images/events/bandung-creative.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Expo Entry + Free Cupping',
                        'desc' => 'Termasuk akses seluruh booth roastery dan kupon free tasting.',
                        'quota' => 150,
                        'price' => 35000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoId,
                'category_id' => $categories['workshop'] ?? 1,
                'title' => 'Product Design Thinking Interactive Jam',
                'slug' => 'product-design-thinking-interactive-jam',
                'description' => 'Sesi kolaborasi intensif merancang solusi produk digital dengan metode Design Sprint.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Menara BTPN, Mega Kuningan',
                'address' => 'Jl. Dr. Ide Anak Agung Gde Agung Kav 5.5, Kuningan, Jakarta Selatan',
                'online_url' => null,
                'starts_at' => '2026-10-25 09:00:00+07',
                'ends_at' => '2026-10-25 15:00:00+07',
                'banner_path' => '/images/events/design_hero.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Design Jam Seat',
                        'desc' => 'Termasuk perlengkapan sprint kit, snack, dan e-sertifikat.',
                        'quota' => 40,
                        'price' => 65000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoId,
                'category_id' => $categories['komunitas'] ?? 1,
                'title' => 'Jakarta Tech Meetup 2026',
                'slug' => 'jakarta-tech-meetup-2026',
                'description' => 'Temu komunitas developer dan praktisi teknologi Jakarta untuk berbagi pengalaman arsitektur modern.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Kuningan City, Jakarta',
                'address' => 'Jl. Prof. DR. Satrio Kav. 18, Kuningan, Jakarta Selatan',
                'online_url' => null,
                'starts_at' => '2026-10-28 16:00:00+07',
                'ends_at' => '2026-10-28 20:00:00+07',
                'banner_path' => '/images/events/tech_hero.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Community Pass (Gratis)',
                        'desc' => 'Akses sesi lightning talk dan networking komunitas.',
                        'quota' => 100,
                        'price' => 0.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['olahraga'] ?? 1,
                'title' => 'Sunday Morning Yoga Session',
                'slug' => 'sunday-morning-yoga-session',
                'description' => 'Sesi yoga pagi menyegarkan di ruang terbuka hijau bersama instruktur bersertifikat.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Taman Menteng, Jakarta',
                'address' => 'Jl. HOS. Cokroaminoto, Menteng, Jakarta Pusat',
                'online_url' => null,
                'starts_at' => '2026-11-01 08:00:00+07',
                'ends_at' => '2026-11-01 10:30:00+07',
                'banner_path' => '/images/events/marathon_hero.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Yoga Session Pass',
                        'desc' => 'Termasuk cold-pressed juice dan peminjaman matras yoga.',
                        'quota' => 35,
                        'price' => 50000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['lainnya'] ?? 1,
                'title' => 'Stand Up Comedy Night: Local Heroes',
                'slug' => 'stand-up-comedy-night-local-heroes',
                'description' => 'Malam tawa lepas bersama deretan komika lokal terbaik dalam pertunjukan spesial.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'Kemang, Jakarta',
                'address' => 'Jl. Kemang Raya, Bangka, Jakarta Selatan',
                'online_url' => null,
                'starts_at' => '2026-11-05 19:00:00+07',
                'ends_at' => '2026-11-05 22:00:00+07',
                'banner_path' => '/images/events/soundscapes.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Regular Seat',
                        'desc' => 'Kursi area pertunjukan utama dan welcome drink.',
                        'quota' => 60,
                        'price' => 100000.00,
                    ],
                ],
            ],
            [
                'eo_id' => $eoKreatorId,
                'category_id' => $categories['pameran'] ?? 1,
                'title' => 'Bazar UMKM Kreatif Nusantara',
                'slug' => 'bazar-umkm-kreatif-nusantara',
                'description' => 'Pameran produk kerajinan tangan, fesyen lokal, dan kuliner UMKM unggulan dari seluruh nusantara.',
                'event_type' => 'OFFLINE',
                'venue_name' => 'JIExpo Kemayoran, Jakarta',
                'address' => 'Arena JIExpo Kemayoran, Jakarta Pusat',
                'online_url' => null,
                'starts_at' => '2026-11-10 10:00:00+07',
                'ends_at' => '2026-11-10 20:00:00+07',
                'banner_path' => '/images/events/hero_festival.jpg',
                'status' => 'PUBLISHED',
                'tickets' => [
                    [
                        'name' => 'Tiket Masuk Pengunjung (Gratis)',
                        'desc' => 'Akses masuk seluruh hall pameran UMKM.',
                        'quota' => 250,
                        'price' => 0.00,
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
