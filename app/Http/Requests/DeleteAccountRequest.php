<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DeleteAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => is_string($this->email) ? mb_strtolower(trim($this->email)) : $this->email,
            'confirmation' => is_string($this->confirmation) ? trim($this->confirmation) : $this->confirmation,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'confirmation' => ['required', 'string', 'in:HAPUS AKUN'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Konfirmasi alamat email akun wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'confirmation.required' => 'Ketik HAPUS AKUN untuk mengonfirmasi penghapusan akun.',
            'confirmation.in' => 'Teks konfirmasi harus persis "HAPUS AKUN" (huruf kapital).',
        ];
    }
}
