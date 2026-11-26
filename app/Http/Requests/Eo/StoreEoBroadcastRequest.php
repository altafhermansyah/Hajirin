<?php

namespace App\Http\Requests\Eo;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreEoBroadcastRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isEo() ?? false;
    }

    /**
     * Prepare input before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'title' => trim((string) $this->input('title', '')),
            'message' => trim((string) $this->input('message', '')),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event_id' => ['required', 'uuid'],
            'title' => ['required', 'string', 'min:4', 'max:150'],
            'message' => ['required', 'string', 'min:10', 'max:1000'],
            'send_email' => ['nullable', 'boolean'],
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
            'event_id.required' => 'Pilih event tujuan pengumuman terlebih dahulu.',
            'event_id.uuid' => 'Event tujuan tidak valid.',
            'title.required' => 'Judul pengumuman wajib diisi.',
            'title.min' => 'Judul pengumuman minimal 4 karakter.',
            'title.max' => 'Judul pengumuman maksimal 150 karakter.',
            'message.required' => 'Isi pesan pengumuman wajib diisi.',
            'message.min' => 'Isi pesan pengumuman minimal 10 karakter.',
            'message.max' => 'Isi pesan pengumuman maksimal 1.000 karakter.',
        ];
    }
}
