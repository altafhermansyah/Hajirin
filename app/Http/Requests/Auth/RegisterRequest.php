<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalisasi email (lowercase) serta spasi, tanda hubung, dan awalan + pada nomor telepon sebelum validasi.
     */
    protected function prepareForValidation(): void
    {
        $updates = [];

        if ($this->has('email')) {
            $updates['email'] = mb_strtolower(trim((string) $this->input('email')));
        }

        if (is_string($this->phone)) {
            $updates['phone'] = preg_replace('/[\s\-\.\(\)\+]+/', '', trim($this->phone));
        }

        if ($updates !== []) {
            $this->merge($updates);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^[0-9]{9,15}$/'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'terms' => ['accepted'],
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
            'name.required' => 'Nama lengkap wajib diisi.',
            'name.max' => 'Nama maksimal 100 karakter.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar.',
            'phone.required' => 'Nomor WhatsApp / HP wajib diisi untuk kelengkapan data diri.',
            'phone.regex' => 'Nomor WhatsApp / HP harus berupa 9 sampai 15 digit angka.',
            'terms.accepted' => 'Anda wajib menyetujui Ketentuan Layanan, Kebijakan Privasi, dan pernyataan usia minimal 18 tahun atau izin wali.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ];
    }
}
