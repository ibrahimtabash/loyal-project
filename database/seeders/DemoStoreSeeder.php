<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoStoreSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Demo data is only allowed in local/testing environments.');
        }
        if (Store::where('slug', 'dar')->exists()) {
            $this->call(DemoRewardsSeeder::class);

            return;
        }
        // No shared demo login or real recipient. Register your own merchant to accept orders.
        $user = User::firstOrCreate(['email' => 'demo@rejaa.example'], ['name' => 'متجر تجريبي', 'password' => Str::random(64)]);
        $store = Store::create([
            'user_id' => $user->id, 'name' => 'دار', 'slug' => 'dar',
            'tagline' => 'تفاصيل صغيرة، تُشبه البيت.',
            'description' => 'قطع نختارها بحب، لتضيف الدفء والبساطة إلى مساحتك. اكتشف أشياء جميلة ليومك، وللزوايا التي تحبّها.',
            'hero_image' => '/images/store-hero.jpg', 'city' => 'رام الله، فلسطين',
            'currency' => 'ILS', 'delivery_fee' => 2000, 'is_published' => true,
        ]);
        $this->call(DemoRewardsSeeder::class);
        foreach ([
            ['إناء فخّاري بلمسة طبيعية', 'أواني وفخّار', 8500, 11000, 'ceramics', 8, true, 'دفء الألوان الترابية وأناقة التفاصيل البسيطة، لركن تحبّه في بيتك.'],
            ['كرسي استرخاء خشبي', 'أثاث', 42000, null, 'chair', 40, true, 'مساحة صغيرة للهدوء. كرسي بتصميم بسيط ينسجم مع زوايا بيتك.'],
            ['نبتة في أصيص خزفي', 'نباتات', 6500, null, 'plant', 6, true, 'لمسة خضراء تمنح مكتبك أو نافذتك حياة جديدة.'],
            ['مصباح أرضي أنيق', 'إضاءة', 18000, 22000, 'lamp', 18, true, 'إضاءة دافئة للأمسيات الهادئة، وتصميم يكمل جمال المساحة.'],
            ['أريكة بلون الطبيعة', 'أثاث', 165000, null, 'sofa', 100, false, 'قطعة أساسية للّقاءات الجميلة ولحظات الراحة في منزلك.'],
            ['تنسيق ركن المعيشة', 'ديكور', 32000, null, 'interior', 30, false, 'اختيار تجريبي لعرض تنسيق الألوان والخامات في مساحة واحدة.'],
            ['تفاصيل لمساحة هادئة', 'ديكور', 9500, null, 'decor', 9, false, 'أضف لمستك الشخصية إلى المنزل مع مجموعتنا من التفاصيل المختارة.'],
            ['مجموعة البيت الدافئ', 'ديكور', 25000, 29000, 'store-hero', 25, false, 'مجموعة إلهام تجريبية تجمع الألوان الطبيعية والتفاصيل الدافئة.'],
        ] as [$name, $category, $price, $compare, $image, $points, $featured, $description]) {
            $store->products()->create(['name' => $name, 'category' => $category, 'price' => $price, 'compare_price' => $compare, 'image' => '/images/'.$image.'.jpg', 'reward_points' => $points, 'is_featured' => $featured, 'description' => $description]);
        }
    }
}
