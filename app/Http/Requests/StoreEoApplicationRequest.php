<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreEoApplicationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'USER';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'organization_name' => ['required', 'string', 'max:150'],
            'contact_phone' => ['required', 'string', 'max:25'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'reason' => ['required', 'string', 'min:20', 'max:2000'],
        ];
    }

    /**
     * Custom messages for validation errors in Bahasa Indonesia.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'organization_name.required' => 'Nama organisasi, komunitas, atau promotor wajib diisi.',
            'organization_name.max' => 'Nama organisasi maksimal 150 karakter.',
            'contact_phone.required' => 'Nomor WhatsApp / telepon penanggung jawab wajib diisi.',
            'contact_phone.max' => 'Nomor telepon maksimal 25 karakter.',
            'portfolio_url.url' => 'Tautan portofolio atau media sosial harus berupa URL yang valid (contoh: https://instagram.com/...).',
            'portfolio_url.max' => 'Tautan portofolio maksimal 255 karakter.',
            'document.required' => 'Berkas gabungan verifikasi identitas & legalitas wajib diunggah.',
            'document.file' => 'Berkas yang diunggah tidak valid.',
            'document.mimes' => 'Berkas verifikasi harus berformat PDF, JPG, JPEG, atau PNG.',
            'document.max' => 'Ukuran berkas verifikasi maksimal 5 MB.',
            'reason.required' => 'Deskripsi dan rencana penyelenggaraan event wajib diisi.',
            'reason.min' => 'Deskripsi dan rencana event minimal 20 karakter agar dapat ditinjau Admin.',
            'reason.max' => 'Deskripsi dan rencana event maksimal 2000 karakter.',
        ];
    }
}
