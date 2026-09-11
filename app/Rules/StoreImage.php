<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Storage;

class StoreImage implements ValidationRule
{
    public function __construct(private int $storeId) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (filter_var($value, FILTER_VALIDATE_URL) && parse_url($value, PHP_URL_SCHEME) === 'https') {
            return;
        }
        if (preg_match('#^/images/[a-z0-9-]+\.(jpg|png|webp)$#', $value) && is_file(public_path($value))) {
            return;
        }
        if (preg_match('#^/media/'.$this->storeId.'/([a-f0-9-]+\.(jpg|jpeg|png|webp))$#', $value, $match)
            && Storage::disk('local')->exists('store-media/'.$this->storeId.'/'.$match[1])) {
            return;
        }
        $fail('اختر صورة مرفوعة لمتجرك أو رابط HTTPS صالحاً.');
    }
}
