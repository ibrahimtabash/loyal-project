<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PointEntry extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['idempotency_key'];

    protected function casts(): array
    {
        return ['delta' => 'integer', 'balance_after' => 'integer'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new \LogicException('Point entries are append-only. Record a correction instead.'));
        static::deleting(fn () => throw new \LogicException('Point entries cannot be deleted.'));
    }
}
