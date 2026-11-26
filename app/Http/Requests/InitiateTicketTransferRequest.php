<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class InitiateTicketTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'recipient_name' => is_string($this->recipient_name) ? trim($this->recipient_name) : $this->recipient_name,
            'recipient_email' => is_string($this->recipient_email) ? mb_strtolower(trim($this->recipient_email)) : $this->recipient_email,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recipient_name' => ['required', 'string', 'max:100'],
            'recipient_email' => ['required', 'string', 'email', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recipient_name.required' => 'Nama lengkap penerima tiket wajib diisi.',
            'recipient_name.max' => 'Nama penerima maksimal 100 karakter.',
            'recipient_email.required' => 'Alamat email penerima wajib diisi.',
            'recipient_email.email' => 'Format alamat email penerima tidak valid.',
            'recipient_email.max' => 'Alamat email penerima maksimal 255 karakter.',
        ];
    }
}
