<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hajirin - Website Management Event & Ticketing</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('hajirin_icon.svg') }}">
    <!-- Font Plus Jakarta Sans -->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <!-- FontAwesome for Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Plus Jakarta Sans', 'sans-serif'],
                    },
                    colors: {
                        navy: '#0D1B2A',
                        slate: '#64748B',
                        blue: '#1D4ED8',
                        lightgray: '#F8FAFC',
                    }
                }
            }
        }
    </script>
    <style>
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
    </style>
</head>

<body class="bg-white text-navy font-sans antialiased">

    <!-- Navbar -->
    <nav class="flex justify-between items-center px-10 py-4 border-b border-gray-100 bg-white sticky top-0 z-50">
        <div class="flex items-center space-x-8">
            <!-- Logo -->
            <div class="flex items-center space-x-2">
                <img src="{{ asset('hajirin_icon.svg') }}" alt="Logo Hajirin" class="h-8 w-auto">
                <span class="font-bold text-2xl tracking-tighter">HAJIRIN</span>
            </div>
            <!-- Links -->
            <div class="hidden md:flex space-x-6 text-sm font-medium text-gray-700">
                <a href="#" class="hover:text-blue">Jelajah Event</a>
                <a href="#" class="hover:text-blue">Kategori</a>
            </div>
        </div>
        <div class="flex items-center space-x-4">
            <a href="#"
                class="text-sm font-semibold border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">Buat
                Event</a>
            <button class="text-gray-500 hover:text-navy"><i class="fa-solid fa-magnifying-glass"></i></button>

            @auth
                <div class="flex items-center space-x-3 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
                    <div class="w-7 h-7 rounded-full bg-blue text-white flex items-center justify-center font-bold text-xs uppercase">
                        {{ substr(Auth::user()->name, 0, 1) }}
                    </div>
                    <div class="text-left">
                        <p class="text-xs font-bold text-navy leading-tight">{{ Auth::user()->name }}</p>
                        <span class="text-[10px] text-gray-500 font-medium">{{ Auth::user()->role }}</span>
                    </div>
                    <form method="POST" action="{{ route('logout') }}" class="inline ml-2">
                        @csrf
                        <button type="submit" title="Keluar" class="text-gray-400 hover:text-red-600 transition-colors p-1">
                            <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                        </button>
                    </form>
                </div>
            @else
                <button type="button" data-auth-trigger="login" class="text-sm font-semibold border border-gray-300 px-5 py-2 rounded-lg text-gray-700 hover:text-navy cursor-pointer">
                    Masuk
                </button>
                <button type="button" data-auth-trigger="register" class="bg-blue text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 cursor-pointer shadow-sm transition-all active:scale-95">
                    Daftar
                </button>
                <button type="button" data-auth-trigger="login" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 cursor-pointer transition">
                    <i class="fa-regular fa-user"></i>
                </button>
            @endauth
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="px-10 py-6">
        <div class="relative rounded-2xl overflow-hidden bg-gray-900 h-[480px]">
            <!-- Background Image Placeholder -->
            <img src="https://images.unsplash.com/photo-1540039155733-d7696d4eb98b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                alt="Festival Musik" class="absolute inset-0 w-full h-full object-cover opacity-50">

            <div class="absolute inset-0 bg-gradient-to-t from-navy/90 to-transparent"></div>

            <div class="absolute bottom-0 left-0 right-0 p-10 flex justify-between items-end">
                <div class="text-white max-w-3xl">
                    <div class="flex items-center space-x-3 mb-4">
                        <span
                            class="bg-white/20 backdrop-blur-sm px-3 py-1 rounded border border-white/30 text-xs font-semibold uppercase tracking-wider">FESTIVAL
                            MUSIK</span>
                        <span
                            class="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded text-xs font-semibold"><i
                                class="fa-solid fa-circle text-[8px] mr-1"></i> Tiket Tersedia</span>
                    </div>
                    <h1 class="text-4xl font-bold mb-3 leading-tight">Festival Musik Nusantara 2026: Merayakan Harmoni
                        Musisi Indie & Elektronik</h1>

                    <div class="flex items-center space-x-6 text-sm text-gray-300 mb-4">
                        <span class="flex items-center"><i class="fa-regular fa-calendar mr-2"></i> 24 - 25 September
                            2026</span>
                        <span class="flex items-center"><i class="fa-solid fa-location-dot mr-2"></i> Stadion Gelora
                            Bung Karno, Jakarta</span>
                    </div>
                    <p class="text-sm text-gray-400 mb-8 max-w-2xl">
                        Dimeriahkan oleh lebih dari 50 musisi lokal di 3 panggung epik. Rasakan pengalaman festival
                        musik yang belum pernah ada sebelumnya.
                    </p>

                    <div class="flex items-center space-x-6">
                        <div>
                            <p class="text-xs text-gray-400 mb-1">Harga Tiket Mulai</p>
                            <p class="text-2xl font-bold">Mulai dari Rp75.000</p>
                        </div>
                        <button
                            class="bg-blue text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center hover:bg-blue-700">
                            Lihat Event <i class="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                        <button
                            class="w-11 h-11 rounded-lg border border-white/30 flex items-center justify-center hover:bg-white/10 text-white">
                            <i class="fa-regular fa-bookmark"></i>
                        </button>
                    </div>
                </div>

                <!-- Carousel Controls -->
                <div class="flex items-center space-x-4 mb-4">
                    <button
                        class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <button
                        class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            <!-- Pagination Dots -->
            <div class="absolute bottom-6 left-10 flex space-x-2">
                <div class="w-6 h-1.5 rounded-full bg-blue"></div>
                <div class="w-2 h-1.5 rounded-full bg-white/40"></div>
                <div class="w-2 h-1.5 rounded-full bg-white/40"></div>
                <div class="w-2 h-1.5 rounded-full bg-white/40"></div>
            </div>
        </div>
    </section>

    <!-- Search Section -->
    <section class="px-10 py-4">
        <div class="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
            <h2 class="text-lg font-bold mb-4">Ada event apa yang ingin kamu datangi?</h2>
            <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div class="flex-1 relative">
                    <i
                        class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input type="text" placeholder="Cari nama event, artis, atau penyelenggara..."
                        class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue">
                </div>
                <div class="w-full md:w-64 relative">
                    <i
                        class="fa-solid fa-location-dot absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <select
                        class="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-blue">
                        <option>Jakarta</option>
                    </select>
                    <i
                        class="fa-solid fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
                </div>
                <div class="w-full md:w-64 relative">
                    <i
                        class="fa-regular fa-calendar absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <select
                        class="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-blue">
                        <option>Semua Waktu</option>
                    </select>
                    <i
                        class="fa-solid fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
                </div>
                <button
                    class="bg-blue text-white px-8 py-3 rounded-lg font-semibold text-sm flex items-center justify-center hover:bg-blue-700">
                    <i class="fa-solid fa-magnifying-glass mr-2"></i> Cari Event
                </button>
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span class="text-gray-500 font-medium">Pencarian Populer:</span>
                <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200">Tech
                    Conference</span>
                <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200">Konser
                    Tulus</span>
                <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200">Surabaya
                    10K</span>
                <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200">Jakarta
                    Marathon</span>
                <span
                    class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200">LocalFest</span>
            </div>
        </div>
    </section>

    <!-- Event Pilihan Untukmu -->
    <section class="px-10 py-8">
        <div class="flex justify-between items-end mb-6">
            <div>
                <h2 class="text-2xl font-bold text-navy mb-1">Event Pilihan Untukmu</h2>
                <p class="text-sm text-slate">Kurasi acara terbaik dengan penawaran menarik pekan ini</p>
            </div>
            <a href="#" class="text-blue font-semibold text-sm flex items-center hover:underline">Lihat Semua <i
                    class="fa-solid fa-arrow-right ml-1"></i></a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Card 1 -->
            <div
                class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col h-full group">
                <div class="relative h-48 bg-gray-200 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80"
                        alt="Event"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div
                        class="absolute top-3 left-3 bg-white px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm">
                        KONFERENSI TEKNO</div>
                    <button
                        class="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-navy"><i
                            class="fa-regular fa-bookmark"></i></button>
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <p class="text-blue text-[11px] font-semibold mb-1 flex items-center"><i
                            class="fa-regular fa-calendar mr-1"></i> Sab, 24 Okt 2026 • 09:00 WIB</p>
                    <h3 class="font-bold text-base leading-tight mb-2 line-clamp-2">Indonesia Tech Conference 2026: The
                        Future of AI &...</h3>
                    <div class="mt-auto">
                        <p class="text-slate text-xs mb-1 flex items-center"><i
                                class="fa-solid fa-location-dot w-3 text-center mr-1"></i> ICE BSD Hall 1, Tangerang
                        </p>
                        <p class="text-slate text-xs flex items-center"><i
                                class="fa-regular fa-circle-user w-3 text-center mr-1"></i> TechID Community</p>
                    </div>
                </div>
                <div class="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <p class="text-[10px] text-gray-500">Mulai dari</p>
                        <p class="font-bold text-blue text-lg">Rp150.000</p>
                    </div>
                    <button
                        class="border border-gray-300 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100">Beli
                        Tiket</button>
                </div>
            </div>

            <!-- Card 2 -->
            <div
                class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col h-full group">
                <div class="relative h-48 bg-gray-200 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
                        alt="Event"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div
                        class="absolute top-3 left-3 bg-white px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm">
                        WORKSHOP</div>
                    <button
                        class="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-navy"><i
                            class="fa-regular fa-bookmark"></i></button>
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <p class="text-blue text-[11px] font-semibold mb-1 flex items-center"><i
                            class="fa-regular fa-calendar mr-1"></i> Jum, 30 Okt 2026 • 13:00 WIB</p>
                    <h3 class="font-bold text-base leading-tight mb-2 line-clamp-2">UI/UX Masterclass & Design Systems
                        Bootcamp</h3>
                    <div class="mt-auto">
                        <p class="text-slate text-xs mb-1 flex items-center"><i
                                class="fa-solid fa-location-dot w-3 text-center mr-1"></i> Menara Mandiri lt. 12,
                            Jakarta</p>
                        <p class="text-slate text-xs flex items-center"><i
                                class="fa-regular fa-circle-user w-3 text-center mr-1"></i> Klaban Design ID</p>
                    </div>
                </div>
                <div class="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <p class="text-[10px] text-gray-500">Mulai dari</p>
                        <p class="font-bold text-blue text-lg">Rp50.000</p>
                    </div>
                    <button
                        class="border border-gray-300 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100">Beli
                        Tiket</button>
                </div>
            </div>

            <!-- Card 3 -->
            <div
                class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col h-full group">
                <div class="relative h-48 bg-gray-200 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80"
                        alt="Event"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div
                        class="absolute top-3 left-3 bg-white px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm">
                        OLAHRAGA</div>
                    <button
                        class="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-navy"><i
                            class="fa-regular fa-bookmark"></i></button>
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <p class="text-blue text-[11px] font-semibold mb-1 flex items-center"><i
                            class="fa-regular fa-calendar mr-1"></i> Min, 01 Nov 2026 • 05:30 WIB</p>
                    <h3 class="font-bold text-base leading-tight mb-2 line-clamp-2">Jakarta Sunrise Marathon 2026: Run
                        for Green Planet</h3>
                    <div class="mt-auto">
                        <p class="text-slate text-xs mb-1 flex items-center"><i
                                class="fa-solid fa-location-dot w-3 text-center mr-1"></i> Plaza FX Sudirman, Jakarta
                        </p>
                        <p class="text-slate text-xs flex items-center"><i
                                class="fa-regular fa-circle-user w-3 text-center mr-1"></i> IndoRunners Network</p>
                    </div>
                </div>
                <div class="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <p class="text-[10px] text-gray-500">Mulai dari</p>
                        <p class="font-bold text-blue text-lg">Rp125.000</p>
                    </div>
                    <button
                        class="border border-gray-300 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100">Beli
                        Tiket</button>
                </div>
            </div>

            <!-- Card 4 -->
            <div
                class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col h-full group">
                <div class="relative h-48 bg-gray-200 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1470229722913-7c092bcebf4f?auto=format&fit=crop&w=600&q=80"
                        alt="Event"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div
                        class="absolute top-3 left-3 bg-white px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm">
                        FESTIVAL MUSIK</div>
                    <button
                        class="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-navy"><i
                            class="fa-regular fa-bookmark"></i></button>
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <p class="text-blue text-[11px] font-semibold mb-1 flex items-center"><i
                            class="fa-regular fa-calendar mr-1"></i> Sab, 30 Nov 2026 • 15:00 WIB</p>
                    <h3 class="font-bold text-base leading-tight mb-2 line-clamp-2">Soundscapes Indie & Electronic
                        Music Night</h3>
                    <div class="mt-auto">
                        <p class="text-slate text-xs mb-1 flex items-center"><i
                                class="fa-solid fa-location-dot w-3 text-center mr-1"></i> Campus Center Timur, Jakarta
                        </p>
                        <p class="text-slate text-xs flex items-center"><i
                                class="fa-regular fa-circle-user w-3 text-center mr-1"></i> Nusantara Live</p>
                    </div>
                </div>
                <div class="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <p class="text-[10px] text-gray-500">Mulai dari</p>
                        <p class="font-bold text-blue text-lg">Rp85.000</p>
                    </div>
                    <button
                        class="border border-gray-300 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100">Beli
                        Tiket</button>
                </div>
            </div>
        </div>
    </section>

    <!-- Sedang Populer -->
    <section class="px-10 py-8">
        <div class="flex justify-between items-end mb-6">
            <div>
                <h2 class="text-2xl font-bold text-navy mb-1">Sedang Populer</h2>
                <p class="text-sm text-slate">Event yang sedang banyak dilihat minggu ini</p>
            </div>
            <a href="#" class="text-blue font-semibold text-sm flex items-center hover:underline">Lihat Semua <i
                    class="fa-solid fa-arrow-right ml-1"></i></a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Populer 1 -->
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
                <div class="relative h-40 bg-gray-200 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=600&q=80"
                        alt="Event"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div
                        class="absolute top-3 left-3 bg-blue text-white px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm">
                        Populer</div>
                </div>
                <div class="p-4">
                    <p class="text-slate text-[11px] font-semibold mb-1">14 - 15 Nov 2026</p>
                    <h3 class="font-bold text-[15px] leading-tight mb-2 line-clamp-2">Startup Growth Festival 2026:
                        Scale Up Beyond...</h3>
                    <p class="text-slate text-xs mb-4 flex items-center"><i
                            class="fa-solid fa-location-dot w-3 mr-1 text-gray-400"></i> JCC Senayan, Jakarta</p>
                    <div class="flex justify-between items-center mt-2">
                        <p class="font-bold text-blue text-lg">Rp75.000</p>
                        <p class="text-xs text-gray-500 font-medium">Tersedia</p>
                    </div>
                </div>
            </div>

            <!-- Populer 2 -->
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
                <div class="relative h-40 bg-gray-200 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80"
                        alt="Event"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div
                        class="absolute top-3 left-3 bg-orange-100 text-orange-600 px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm border border-orange-200">
                        Hampir Habis</div>
                    <div
                        class="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-semibold">
                        Sisa 12 Tiket</div>
                </div>
                <div class="p-4">
                    <p class="text-slate text-[11px] font-semibold mb-1">21 Nov 2026</p>
                    <h3 class="font-bold text-[15px] leading-tight mb-2 line-clamp-2">Nusantara Indie Soundwave:
                        Special Showcase Vol. 4</h3>
                    <p class="text-slate text-xs mb-4 flex items-center"><i
                            class="fa-solid fa-location-dot w-3 mr-1 text-gray-400"></i> Bari Bintaro, Jakarta</p>
                    <div class="flex justify-between items-center mt-2">
                        <p class="font-bold text-blue text-lg">Rp90.000</p>
                        <p class="text-xs text-orange-500 font-bold">Cepat Habis</p>
                    </div>
                </div>
            </div>

            <!-- Populer 3 -->
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
                <div class="relative h-40 bg-gray-200 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1531498860502-7c67cf02f657?auto=format&fit=crop&w=600&q=80"
                        alt="Event"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div
                        class="absolute top-3 left-3 bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm border border-emerald-200">
                        Baru</div>
                </div>
                <div class="p-4">
                    <p class="text-slate text-[11px] font-semibold mb-1">28 Nov 2026</p>
                    <h3 class="font-bold text-[15px] leading-tight mb-2 line-clamp-2">AI Product Management: From LLM
                        to Production</h3>
                    <p class="text-slate text-xs mb-4 flex items-center"><i
                            class="fa-solid fa-location-dot w-3 mr-1 text-gray-400"></i> Cilandak Town Square, Jakarta
                    </p>
                    <div class="flex justify-between items-center mt-2">
                        <p class="font-bold text-blue text-lg">Rp99.000</p>
                        <p class="text-xs text-gray-500 font-medium">Tersedia</p>
                    </div>
                </div>
            </div>

            <!-- Populer 4 -->
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
                <div class="relative h-40 bg-gray-200 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=600&q=80"
                        alt="Event"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div
                        class="absolute top-3 left-3 bg-blue text-white px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm">
                        Populer</div>
                </div>
                <div class="p-4">
                    <p class="text-slate text-[11px] font-semibold mb-1">05 Des 2026</p>
                    <h3 class="font-bold text-[15px] leading-tight mb-2 line-clamp-2">Bandung Creative & Typography
                        Showcase 2026</h3>
                    <p class="text-slate text-xs mb-4 flex items-center"><i
                            class="fa-solid fa-location-dot w-3 mr-1 text-gray-400"></i> Margo City, Bandung</p>
                    <div class="flex justify-between items-center mt-2">
                        <p class="font-bold text-blue text-lg">Rp50.000</p>
                        <p class="text-xs text-gray-500 font-medium">Tersedia</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Jelajahi Berdasarkan Kategori -->
    <section class="px-10 py-8 bg-lightgray border-y border-gray-100">
        <h2 class="text-2xl font-bold text-navy mb-1">Jelajahi Berdasarkan Kategori</h2>
        <p class="text-sm text-slate mb-6">Temukan event sesuai minat dan hobi kamu</p>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <a href="#"
                class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue hover:text-blue transition group shadow-sm">
                <i class="fa-solid fa-headphones text-2xl text-gray-400 mb-2 group-hover:text-blue"></i>
                <span class="text-sm font-semibold">Musik</span>
            </a>
            <a href="#"
                class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue hover:text-blue transition group shadow-sm">
                <i class="fa-solid fa-users text-2xl text-gray-400 mb-2 group-hover:text-blue"></i>
                <span class="text-sm font-semibold">Seminar</span>
            </a>
            <a href="#"
                class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue hover:text-blue transition group shadow-sm">
                <i class="fa-solid fa-chalkboard-user text-2xl text-gray-400 mb-2 group-hover:text-blue"></i>
                <span class="text-sm font-semibold">Workshop</span>
            </a>
            <a href="#"
                class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue hover:text-blue transition group shadow-sm">
                <i class="fa-solid fa-person-running text-2xl text-gray-400 mb-2 group-hover:text-blue"></i>
                <span class="text-sm font-semibold">Olahraga</span>
            </a>
            <a href="#"
                class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue hover:text-blue transition group shadow-sm">
                <i class="fa-solid fa-people-group text-2xl text-gray-400 mb-2 group-hover:text-blue"></i>
                <span class="text-sm font-semibold">Komunitas</span>
            </a>
            <a href="#"
                class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue hover:text-blue transition group shadow-sm">
                <i class="fa-solid fa-tents text-2xl text-gray-400 mb-2 group-hover:text-blue"></i>
                <span class="text-sm font-semibold">Festival</span>
            </a>
            <a href="#"
                class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue hover:text-blue transition group shadow-sm">
                <i class="fa-solid fa-palette text-2xl text-gray-400 mb-2 group-hover:text-blue"></i>
                <span class="text-sm font-semibold">Pameran</span>
            </a>
            <a href="#"
                class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue hover:text-blue transition group shadow-sm">
                <i class="fa-solid fa-bars text-2xl text-gray-400 mb-2 group-hover:text-blue"></i>
                <span class="text-sm font-semibold">Lainnya</span>
            </a>
        </div>
    </section>

    <!-- Event Terdekat -->
    <section class="px-10 py-10">
        <div class="flex justify-between items-end mb-6">
            <div>
                <h2 class="text-2xl font-bold text-navy mb-1">Event Terdekat</h2>
                <p class="text-sm text-slate">Temukan acara seru yang berlokasi dekat di sekitarmu</p>
            </div>
            <div class="flex items-center space-x-4">
                <button
                    class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold flex items-center bg-white text-gray-700 hover:bg-gray-50">
                    <i class="fa-solid fa-location-dot mr-2 text-red-500"></i> Jakarta <i
                        class="fa-solid fa-chevron-down ml-2 text-xs text-gray-400"></i>
                </button>
                <a href="#" class="text-blue font-semibold text-sm flex items-center hover:underline">Lihat
                    Semua Event <i class="fa-solid fa-arrow-right ml-1"></i></a>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- Item 1 -->
            <div class="border border-gray-200 p-4 rounded-xl hover:shadow-md transition bg-white flex flex-col">
                <div class="flex justify-between text-[11px] font-semibold text-slate mb-2">
                    <span class="text-blue">21 Okt 2026</span>
                    <span>14:00 WIB</span>
                </div>
                <h3 class="font-bold text-[15px] mb-2 leading-tight">FinTech Indonesia Leadership Summit 2026</h3>
                <div class="mt-auto">
                    <p class="text-slate text-xs mb-1 flex items-center"><i
                            class="fa-solid fa-location-dot w-3 mr-1 text-gray-400"></i> Senayan, Jakarta</p>
                    <p class="text-slate text-[11px] mb-4 flex items-center"><i
                            class="fa-regular fa-circle-user w-3 mr-1 text-gray-400"></i> OJK / Asosiasi FinTech Indo
                    </p>
                    <div class="flex justify-between items-center">
                        <p class="font-bold text-navy">Rp200.000</p>
                        <a href="#" class="text-blue text-xs font-semibold hover:underline">Detail <i
                                class="fa-solid fa-arrow-right ml-1 text-[10px]"></i></a>
                    </div>
                </div>
            </div>

            <!-- Item 2 -->
            <div class="border border-gray-200 p-4 rounded-xl hover:shadow-md transition bg-white flex flex-col">
                <div class="flex justify-between text-[11px] font-semibold text-slate mb-2">
                    <span class="text-blue">24 Okt 2026</span>
                    <span>10:00 WIB</span>
                </div>
                <h3 class="font-bold text-[15px] mb-2 leading-tight">Jakarta Art & Culture Installation Weekend</h3>
                <div class="mt-auto">
                    <p class="text-slate text-xs mb-1 flex items-center"><i
                            class="fa-solid fa-location-dot w-3 mr-1 text-gray-400"></i> Museum Nasional, Jakarta</p>
                    <p class="text-slate text-[11px] mb-4 flex items-center"><i
                            class="fa-regular fa-circle-user w-3 mr-1 text-gray-400"></i> Dinas Pariwisata DKI Jakarta
                    </p>
                    <div class="flex justify-between items-center">
                        <p class="font-bold text-navy">Rp45.000</p>
                        <a href="#" class="text-blue text-xs font-semibold hover:underline">Detail <i
                                class="fa-solid fa-arrow-right ml-1 text-[10px]"></i></a>
                    </div>
                </div>
            </div>

            <!-- Item 3 -->
            <div class="border border-gray-200 p-4 rounded-xl hover:shadow-md transition bg-white flex flex-col">
                <div class="flex justify-between text-[11px] font-semibold text-slate mb-2">
                    <span class="text-blue">24 Okt 2026</span>
                    <span>15:00 WIB</span>
                </div>
                <h3 class="font-bold text-[15px] mb-2 leading-tight">Indie Coffee & Culinary Expo</h3>
                <div class="mt-auto">
                    <p class="text-slate text-xs mb-1 flex items-center"><i
                            class="fa-solid fa-location-dot w-3 mr-1 text-gray-400"></i> GBK Area, Jakarta Selatan</p>
                    <p class="text-slate text-[11px] mb-4 flex items-center"><i
                            class="fa-regular fa-circle-user w-3 mr-1 text-gray-400"></i> Kopi Nusantara Asosiasi</p>
                    <div class="flex justify-between items-center">
                        <p class="font-bold text-navy">Rp35.000</p>
                        <a href="#" class="text-blue text-xs font-semibold hover:underline">Detail <i
                                class="fa-solid fa-arrow-right ml-1 text-[10px]"></i></a>
                    </div>
                </div>
            </div>

            <!-- Item 4 -->
            <div class="border border-gray-200 p-4 rounded-xl hover:shadow-md transition bg-white flex flex-col">
                <div class="flex justify-between text-[11px] font-semibold text-slate mb-2">
                    <span class="text-blue">25 Okt 2026</span>
                    <span>09:00 WIB</span>
                </div>
                <h3 class="font-bold text-[15px] mb-2 leading-tight">Product Design Thinking Interactive Jam</h3>
                <div class="mt-auto">
                    <p class="text-slate text-xs mb-1 flex items-center"><i
                            class="fa-solid fa-location-dot w-3 mr-1 text-gray-400"></i> Menara BTPN, Mega Kuningan</p>
                    <p class="text-slate text-[11px] mb-4 flex items-center"><i
                            class="fa-regular fa-circle-user w-3 mr-1 text-gray-400"></i> GoJek UX / UI Design Hub Indo
                    </p>
                    <div class="flex justify-between items-center">
                        <p class="font-bold text-navy">Rp65.000</p>
                        <a href="#" class="text-blue text-xs font-semibold hover:underline">Detail <i
                                class="fa-solid fa-arrow-right ml-1 text-[10px]"></i></a>
                    </div>
                </div>
            </div>
        </div>

        <div class="text-center">
            <button
                class="border border-gray-300 rounded-lg px-6 py-2.5 text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 inline-flex items-center shadow-sm">
                Lihat Lebih Banyak Event Terdekat <i class="fa-solid fa-chevron-down ml-2 text-xs"></i>
            </button>
        </div>
    </section>

    <!-- Call to Action EO -->
    <section class="px-10 py-10">
        <div
            class="bg-navy rounded-2xl p-10 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
            <!-- Background Decoration -->
            <div
                class="absolute top-0 right-0 w-64 h-64 bg-blue/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2">
            </div>

            <div class="text-white max-w-2xl relative z-10">
                <p class="text-[#EAB308] text-xs font-bold tracking-widest mb-3 uppercase">UNTUK PENYELENGGARA ACARA
                </p>
                <h2 class="text-3xl font-bold mb-3">Punya acara yang ingin kamu selenggarakan?</h2>
                <p class="text-gray-300 text-sm">Kelola event, jual tiket secara digital dalam satu sistem, dan pantau
                    secara real-time dari tingkat pengunjung hingga hasil penjualanmu!</p>
            </div>

            <div class="mt-6 md:mt-0 flex flex-col items-center md:items-end relative z-10">
                <button
                    class="bg-blue text-white px-8 py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center mb-3 w-full md:w-auto hover:bg-blue-700 shadow-lg shadow-blue/30">
                    <i class="fa-solid fa-circle-plus mr-2"></i> Mulai Buat Event
                </button>
                <a href="#"
                    class="text-gray-300 text-xs hover:text-white hover:underline flex items-center">Pelajari lebih
                    lanjut <i class="fa-solid fa-arrow-right ml-1 text-[10px]"></i></a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-100 pt-12 pb-6 px-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <!-- Col 1 -->
            <div class="md:col-span-1 pr-4">
    <div class="flex items-center space-x-2 mb-4">
        <!-- Logo -->
        <img src="{{ asset('hajirin_icon.svg') }}" alt="Logo Hajirin" class="h-8 w-auto">
        <span class="font-bold text-xl tracking-tighter">HAJIRIN</span>
    </div>
                <p class="text-xs text-slate mb-6 leading-relaxed">
                    Platform e-ticketing aggregate komunitas dan ekosistem penyelenggara event terpercaya di Indonesia.
                </p>
                <div class="flex flex-col space-y-3 text-xs font-medium text-navy">
                    <a href="#" class="hover:text-blue">Tentang Hajirin</a>
                    <a href="#" class="hover:text-blue">Karir Kami</a>
                    <a href="#" class="hover:text-blue">Kontak</a>
                </div>
            </div>

            <!-- Col 2 -->
            <div>
                <h4 class="font-bold text-sm text-navy mb-5 uppercase tracking-wider">UNTUK PENGUNJUNG</h4>
                <div class="flex flex-col space-y-3 text-xs text-slate">
                    <a href="#" class="hover:text-blue">Jelajah Event</a>
                    <a href="#" class="hover:text-blue">Kategori</a>
                    <a href="#" class="hover:text-blue">Beli Tiket</a>
                </div>
            </div>

            <!-- Col 3 -->
            <div>
                <h4 class="font-bold text-sm text-navy mb-5 uppercase tracking-wider">UNTUK EO</h4>
                <div class="flex flex-col space-y-3 text-xs text-slate">
                    <a href="#" class="hover:text-blue">Buat Event</a>
                    <a href="#" class="hover:text-blue">Harga Tiket</a>
                    <a href="#" data-auth-trigger="login" class="hover:text-blue">Masuk Dashboard</a>
                </div>
            </div>

            <!-- Col 4 -->
            <div>
                <h4 class="font-bold text-sm text-navy mb-5 uppercase tracking-wider">INFORMASI</h4>
                <div class="flex flex-col space-y-3 text-xs text-slate">
                    <a href="#" class="hover:text-blue">Syarat & Ketentuan</a>
                    <a href="#" class="hover:text-blue">Kebijakan Privasi</a>
                    <a href="#" class="hover:text-blue">FAQ</a>
                </div>
            </div>
        </div>

        <div
            class="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center text-[11px] text-gray-400">
            <p>© 2026 Hajirin - Platform E-ticketing & Management Event Indonesia</p>
            <div class="mt-4 md:mt-0 flex items-center space-x-4">
                <span>Pilih Bahasa: Bahasa Indonesia</span>
            </div>
        </div>
    </footer>

    <!-- React Auth Modal Root -->
    <div id="auth-modal-root"></div>

</body>

</html>
