<?php

namespace App\Http\Requests\Eo;

use Illuminate\Foundation\Http\FormRequest;

class CancelEoEventRequest extends FormRequest
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
            'cancellation_reason' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cancellation_reason.required' => 'Alasan pembatalan event wajib diisi.',
            'cancellation_reason.min' => 'Alasan pembatalan minimal 10 karakter.',
            'cancellation_reason.max' => 'Alasan pembatalan maksimal 1000 karakter.',
        ];
    }
}
