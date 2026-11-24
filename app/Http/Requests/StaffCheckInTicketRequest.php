<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StaffCheckInTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->isActive();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ticket_code' => ['required', 'string', 'max:100'],
            'event_id' => ['nullable', 'uuid'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ticket_code.required' => 'Masukkan atau pindai kode e-tiket terlebih dahulu.',
            'ticket_code.string' => 'Format kode e-tiket tidak valid.',
            'ticket_code.max' => 'Kode e-tiket maksimal 100 karakter.',
            'event_id.uuid' => 'Filter event yang dipilih tidak valid.',
        ];
    }
}
