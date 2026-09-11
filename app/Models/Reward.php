<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reward extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['points_cost' => 'integer', 'stock' => 'integer', 'is_active' => 'boolean', 'revision' => 'integer'];
    }
}
