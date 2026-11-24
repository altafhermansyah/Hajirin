<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminCategoryRequest;
use App\Http\Requests\Admin\UpdateAdminCategoryRequest;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminCategoryController extends Controller
{
    /**
     * Tampilkan daftar data master kategori event beserta pencarian dan pagination.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $sort = (string) $request->input('sort', 'name_asc');

        $totalCategories = Category::query()->count();
        $usedCategories = (int) DB::table('events')->distinct('category_id')->count('category_id');
        $totalEventsLinked = (int) DB::table('events')->count();

        $query = Category::query()->withCount('events');

        if ($search !== '') {
            $lower = '%'.mb_strtolower($search).'%';
            $query->where(function ($q) use ($lower): void {
                $q->whereRaw('LOWER(name) LIKE ?', [$lower])
                    ->orWhereRaw('LOWER(slug) LIKE ?', [$lower]);
            });
        }

        match ($sort) {
            'name_desc' => $query->orderBy('name', 'desc'),
            'most_events' => $query->orderByDesc('events_count')->orderBy('name'),
            'latest' => $query->orderByDesc('created_at'),
            default => $query->orderBy('name', 'asc'),
        };

        $categories = $query->paginate(10)->withQueryString()->through(fn (Category $category): array => [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'icon' => $category->icon ?: 'tag',
            'events_count' => (int) $category->events_count,
            'created_at_formatted' => $category->created_at
                ? Carbon::parse($category->created_at)->locale('id')->translatedFormat('d M Y')
                : '-',
        ]);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'stats' => [
                'totalCategories' => $totalCategories,
                'usedCategories' => $usedCategories,
                'unusedCategories' => max(0, $totalCategories - $usedCategories),
                'totalEventsLinked' => $totalEventsLinked,
            ],
            'filters' => [
                'search' => $search,
                'sort' => $sort,
            ],
            'iconOptions' => StoreAdminCategoryRequest::ALLOWED_ICONS,
        ]);
    }

    /**
     * Simpan kategori event baru.
     */
    public function store(StoreAdminCategoryRequest $request): RedirectResponse
    {
        $category = Category::create($request->validated());

        return back()->with('success', "Kategori \"{$category->name}\" berhasil ditambahkan.");
    }

    /**
     * Perbarui data kategori event.
     */
    public function update(UpdateAdminCategoryRequest $request, Category $category): RedirectResponse
    {
        $category->update($request->validated());

        return back()->with('success', "Kategori \"{$category->name}\" berhasil diperbarui.");
    }

    /**
     * Hapus kategori event jika belum digunakan oleh event mana pun.
     */
    public function destroy(Category $category): RedirectResponse
    {
        if ($category->events()->exists()) {
            throw ValidationException::withMessages([
                'category' => "Kategori \"{$category->name}\" tidak dapat dihapus karena masih digunakan oleh event terkait.",
            ]);
        }

        try {
            $category->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'category' => "Kategori \"{$category->name}\" tidak dapat dihapus karena masih memiliki relasi event aktif.",
            ]);
        }

        return back()->with('success', "Kategori \"{$category->name}\" berhasil dihapus.");
    }
}
