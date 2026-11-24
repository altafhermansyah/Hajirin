<?php

namespace App\Http\Requests\Eo;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreEventStaffRequest extends FormRequest
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
            'event_id' => ['required', 'uuid'],
            'email' => ['required', 'email:filter', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'event_id.required' => 'Pilih event terlebih dahulu.',
            'event_id.uuid' => 'Event yang dipilih tidak valid.',
            'email.required' => 'Masukkan alamat email akun panitia yang terdaftar.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.max' => 'Alamat email maksimal 255 karakter.',
        ];
    }
}
