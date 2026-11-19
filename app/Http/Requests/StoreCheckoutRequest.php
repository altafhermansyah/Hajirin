<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event_id' => ['required', 'string', 'exists:events,id'],

            // Mendukung pemilihan banyak jenis tiket yang berbeda (multi-ticket items)
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.ticket_type_id' => ['required_with:items', 'string', 'exists:ticket_types,id'],
            'items.*.ticket_price_id' => ['nullable', 'string', 'exists:ticket_prices,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:100'],

            // Fallback untuk single ticket item jika items tidak dikirim
            'ticket_type_id' => ['required_without:items', 'nullable', 'string', 'exists:ticket_types,id'],
            'ticket_price_id' => ['nullable', 'string', 'exists:ticket_prices,id'],
            'quantity' => ['required_without:items', 'nullable', 'integer', 'min:1', 'max:100'],

            'payment_method' => ['required', 'string', 'in:qris,transfer,card'],
            'attendee_name' => ['required', 'string', 'max:100'],
            'attendee_email' => ['required', 'email', 'max:255'],
            'attendee_phone' => ['nullable', 'string', 'regex:/^[0-9]+$/', 'max:25'],
        ];
    }

    /**
     * Custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'event_id.required' => 'Acara wajib dipilih.',
            'event_id.exists' => 'Acara yang dipilih tidak ditemukan.',
            'ticket_type_id.required_without' => 'Jenis tiket wajib dipilih.',
            'ticket_type_id.exists' => 'Jenis tiket tidak valid.',
            'quantity.required_without' => 'Jumlah tiket wajib diisi.',
            'quantity.min' => 'Jumlah pemesanan minimal 1 tiket.',
            'quantity.max' => 'Jumlah pemesanan melebihi batas maksimal per transaksi.',
            'items.min' => 'Pilih minimal satu tiket untuk melanjutkan pemesanan.',
            'items.*.ticket_type_id.required_with' => 'Jenis tiket wajib dipilih.',
            'items.*.ticket_type_id.exists' => 'Salah satu jenis tiket yang dipilih tidak valid.',
            'items.*.quantity.min' => 'Jumlah tiket minimal 1 per jenis tiket.',
            'payment_method.required' => 'Metode pembayaran wajib dipilih.',
            'payment_method.in' => 'Metode pembayaran tidak valid.',
            'attendee_name.required' => 'Nama lengkap pengunjung wajib diisi.',
            'attendee_name.max' => 'Nama lengkap maksimal 100 karakter.',
            'attendee_email.required' => 'Alamat email pengunjung wajib diisi.',
            'attendee_email.email' => 'Format alamat email pengunjung tidak valid.',
            'attendee_phone.regex' => 'Nomor telepon harus berupa angka, tidak boleh mengandung huruf atau simbol.',
            'attendee_phone.max' => 'Nomor telepon maksimal 25 digit.',
        ];
    }
}
