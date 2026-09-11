<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoRewardsSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Demo rewards are local/testing only.');
        }
        $owner = User::where('email', 'demo@rejaa.example')->first();
        $store = $owner ? Store::where('user_id', $owner->id)->where('slug', 'dar')->first() : null;
        if (! $store || $store->rewards()->exists()) {
            return;
        }
        $store->rewards()->create(['name' => 'لمسة خضراء، هدية إلك', 'description' => 'نبتة صغيرة من دار. مكافأة تجريبية لعرض تجربة الولاء.', 'image' => '/images/plant.jpg', 'points_cost' => 150, 'stock' => 10]);
        $store->rewards()->create(['name' => 'قطعة خزفية تستحق الرِجعة', 'description' => 'قطعة مختارة من مجموعة الخزف. مكافأة تجريبية يقدّمها المتجر.', 'image' => '/images/ceramics.jpg', 'points_cost' => 250, 'stock' => 5]);
    }
}
