<?php

namespace App\Http\Requests\Eo;

use Illuminate\Foundation\Http\FormRequest;

class StoreEoEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'EO';
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'description' => ['required', 'string', 'min:20'],
            'terms_and_conditions' => ['nullable', 'string', 'max:5000'],
            'event_type' => ['required', 'string', 'in:OFFLINE,ONLINE'],
            'city' => ['nullable', 'required_if:event_type,OFFLINE', 'string', 'max:100'],
            'venue_name' => ['nullable', 'required_if:event_type,OFFLINE', 'string', 'max:200'],
            'address' => ['nullable', 'required_if:event_type,OFFLINE', 'string', 'max:1000'],
            'online_url' => ['nullable', 'required_if:event_type,ONLINE', 'url', 'max:500'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'banner' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'submit_action' => ['required', 'string', 'in:DRAFT,PENDING_REVIEW'],
            'tickets' => ['required', 'array', 'min:1'],
            'tickets.*.name' => ['required', 'string', 'max:100', 'distinct'],
            'tickets.*.description' => ['nullable', 'string', 'max:500'],
            'tickets.*.quota' => ['required', 'integer', 'min:1'],
            'tickets.*.max_per_order' => ['required', 'integer', 'min:1', 'max:20'],
            'tickets.*.sale_start' => ['nullable', 'date'],
            'tickets.*.sale_end' => ['nullable', 'date', 'after:tickets.*.sale_start'],
            'tickets.*.price' => ['required', 'numeric', 'min:0'],
            'tickets.*.price_tier_name' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul event wajib diisi.',
            'title.max' => 'Judul event maksimal 200 karakter.',
            'category_id.required' => 'Kategori event wajib dipilih.',
            'category_id.exists' => 'Kategori event yang dipilih tidak valid.',
            'description.required' => 'Deskripsi event wajib diisi.',
            'description.min' => 'Deskripsi event minimal 20 karakter agar informatif bagi calon peserta.',
            'event_type.required' => 'Tipe penyelenggaraan event wajib dipilih.',
            'event_type.in' => 'Tipe event harus OFFLINE atau ONLINE.',
            'city.required_if' => 'Kota penyelenggaraan wajib diisi untuk event Offline.',
            'venue_name.required_if' => 'Nama gedung atau venue wajib diisi untuk event Offline.',
            'address.required_if' => 'Alamat lengkap lokasi wajib diisi untuk event Offline.',
            'online_url.required_if' => 'Tautan streaming/meeting wajib diisi untuk event Online.',
            'online_url.url' => 'Format tautan streaming/meeting harus berupa URL yang valid (https://...).',
            'starts_at.required' => 'Waktu mulai event wajib diisi.',
            'ends_at.required' => 'Waktu selesai event wajib diisi.',
            'ends_at.after' => 'Waktu selesai event harus lebih akhir dari waktu mulai.',
            'banner.image' => 'Poster atau banner event harus berupa file gambar.',
            'banner.mimes' => 'Format poster event harus berupa JPG, JPEG, PNG, atau WEBP.',
            'banner.max' => 'Ukuran file poster event maksimal 4 MB.',
            'tickets.required' => 'Minimal harus terdapat 1 jenis tiket untuk event ini.',
            'tickets.min' => 'Minimal harus terdapat 1 jenis tiket untuk event ini.',
            'tickets.*.name.required' => 'Nama jenis tiket wajib diisi.',
            'tickets.*.name.distinct' => 'Nama jenis tiket tidak boleh kembar dalam satu event yang sama.',
            'tickets.*.quota.required' => 'Kuota tiket wajib diisi.',
            'tickets.*.quota.min' => 'Kuota tiket minimal 1.',
            'tickets.*.max_per_order.required' => 'Batas pembelian maksimal per transaksi wajib diisi.',
            'tickets.*.max_per_order.min' => 'Maksimal pembelian per transaksi minimal 1 tiket.',
            'tickets.*.sale_end.after' => 'Batas akhir penjualan tiket harus setelah waktu mulai penjualan.',
            'tickets.*.price.required' => 'Nominal harga tiket wajib diisi (isi 0 untuk tiket gratis).',
            'tickets.*.price.min' => 'Harga tiket tidak boleh bernilai negatif.',
        ];
    }
}
