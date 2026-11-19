<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'phone' => ['nullable', 'string', 'max:25'],
            'role' => ['required', 'string', 'in:ADMIN,EO,USER'],
            'status' => ['nullable', 'string', 'in:ACTIVE,SUSPENDED'],
            'password' => ['nullable', 'string', 'min:8'],
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
            'name.required' => 'Nama lengkap pengguna wajib diisi.',
            'name.max' => 'Nama tidak boleh melebihi 100 karakter.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini telah digunakan oleh akun lain.',
            'role.required' => 'Pilih hak akses / role pengguna.',
            'role.in' => 'Role yang dipilih tidak valid.',
            'password.min' => 'Kata sandi minimal 8 karakter jika ingin diubah.',
        ];
    }
}
