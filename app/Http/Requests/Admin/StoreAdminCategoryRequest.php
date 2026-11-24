<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreAdminCategoryRequest extends FormRequest
{
    public const ALLOWED_ICONS = [
        'headphones',
        'users',
        'palette',
        'volleyball',
        'user-round',
        'tent-tree',
        'layout-grid',
        'menu',
        'calendar',
        'sparkles',
        'briefcase',
        'graduation-cap',
        'trophy',
        'tag',
    ];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $name = trim((string) $this->input('name', ''));
        $rawSlug = trim((string) $this->input('slug', ''));
        $icon = trim((string) $this->input('icon', ''));

        $this->merge([
            'name' => $name,
            'slug' => $rawSlug !== '' ? Str::slug($rawSlug) : Str::slug($name),
            'icon' => $icon !== '' ? $icon : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', 'unique:categories,name'],
            'slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:categories,slug'],
            'icon' => ['nullable', 'string', 'in:'.implode(',', self::ALLOWED_ICONS)],
        ];
    }

    /**
     * Custom validation error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.max' => 'Nama kategori maksimal 100 karakter.',
            'name.unique' => 'Nama kategori sudah terdaftar.',
            'slug.required' => 'Slug kategori wajib diisi.',
            'slug.max' => 'Slug kategori maksimal 120 karakter.',
            'slug.regex' => 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).',
            'slug.unique' => 'Slug kategori sudah digunakan kategori lain.',
            'icon.in' => 'Ikon kategori yang dipilih tidak valid.',
        ];
    }
}
