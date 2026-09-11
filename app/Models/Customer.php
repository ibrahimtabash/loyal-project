<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['phone_key'];

    protected function casts(): array
    {
        return ['points_balance' => 'integer'];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function entries(): HasMany
    {
        return $this->hasMany(PointEntry::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(CustomerNote::class);
    }

    public static function phoneKey(string $phone): string
    {
        // Remove an explicit international prefix only; never guess a country for a local number.
        $value = ltrim($phone, '+');

        return str_starts_with($value, '00') ? substr($value, 2) : $value;
    }
}
