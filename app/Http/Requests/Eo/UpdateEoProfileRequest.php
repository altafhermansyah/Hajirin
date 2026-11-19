<?php

namespace App\Http\Requests\Eo;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEoProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isEo() ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'organization_name' => ['required', 'string', 'max:150'],
            'contact_phone' => ['required', 'string', 'max:25'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'organization_name.required' => 'Nama organisasi atau brand penyelenggara wajib diisi.',
            'organization_name.max' => 'Nama organisasi maksimal 150 karakter.',
            'contact_phone.required' => 'Kontak PIC / nomor WhatsApp wajib diisi.',
            'contact_phone.max' => 'Kontak PIC maksimal 25 karakter.',
            'portfolio_url.url' => 'Tautan portofolio harus berupa URL yang valid (mis. https://instagram.com/...).',
            'portfolio_url.max' => 'Tautan portofolio maksimal 255 karakter.',
        ];
    }
}
