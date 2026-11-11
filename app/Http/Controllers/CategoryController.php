<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Menampilkan halaman kategori secara dinamis berdasarkan parameter URL.
     * Jika tidak ada parameter yang diberikan, default-nya adalah 'Semua'.
     */
    public function index($type = 'Semua')
    {
        // Mengubah huruf pertama menjadi kapital (misal: 'musik' menjadi 'Musik')
        // agar cocok dengan penamaan kategori di komponen React.
        $formattedType = ucfirst(strtolower($type));

        return Inertia::render('Kategori/Index', [
            'initialCategory' => $formattedType,
        ]);
    }
}
