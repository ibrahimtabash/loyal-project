<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_store_cannot_be_published_without_whatsapp_and_only_owner_store_changes(): void
    {
        $user = User::factory()->create();
        $store = Store::create(['user_id' => $user->id, 'name' => 'متجري', 'slug' => 'my-shop']);
        $other = Store::create(['user_id' => User::factory()->create()->id, 'name' => 'متجر آخر', 'slug' => 'other-shop']);
        $settings = ['name' => 'متجري', 'slug' => 'my-shop', 'tagline' => 'تفاصيل جميلة', 'currency' => 'ILS', 'delivery_fee' => 2000, 'accent' => '#243d32', 'theme' => 'roots', 'is_published' => true, 'store_id' => $other->id];
        $this->actingAs($user)->put('/store', $settings)->assertSessionHasErrors('whatsapp_phone');
        $this->assertFalse($store->fresh()->is_published);
        $this->put('/store', [...$settings, 'whatsapp_phone' => '970599000000'])->assertSessionHasNoErrors()->assertRedirect();
        $this->assertTrue($store->fresh()->is_published);
        $this->assertFalse($other->fresh()->is_published);
        $store->products()->create(['name' => 'منتج', 'price' => 12000]);
        $this->put('/store', [...$settings, 'whatsapp_phone' => '970599000000', 'currency' => 'USD'])->assertSessionHasErrors('currency');
        $this->assertSame('ILS', $store->fresh()->currency);
    }

    public function test_owner_can_switch_store_theme_and_unknown_themes_are_rejected(): void
    {
        $user = User::factory()->create();
        $store = Store::create(['user_id' => $user->id, 'name' => 'متجري', 'slug' => 'my-shop']);
        $settings = ['name' => 'متجري', 'slug' => 'my-shop', 'tagline' => 'تفاصيل جميلة', 'currency' => 'ILS', 'delivery_fee' => 2000, 'accent' => '#6236ba', 'theme' => 'pulse', 'whatsapp_phone' => '970599000000', 'is_published' => true];
        $this->actingAs($user)->put('/store', $settings)->assertSessionHasNoErrors()->assertRedirect();
        $this->assertSame('pulse', $store->fresh()->theme);
        $this->assertSame('#6236ba', $store->fresh()->accent);
        $this->put('/store', [...$settings, 'theme' => 'oasis'])->assertSessionHasErrors('theme');
        $this->assertSame('pulse', $store->fresh()->theme);
        $this->put('/store', [...$settings, 'theme' => 'luxe', 'accent' => '#75532d'])->assertSessionHasNoErrors();
        $this->assertSame('luxe', $store->fresh()->theme);
    }

    public function test_product_input_cannot_reassign_tenant_or_accept_unsafe_image_schemes(): void
    {
        $user = User::factory()->create();
        $store = Store::create(['user_id' => $user->id, 'name' => 'متجري', 'slug' => 'my-shop']);
        $data = ['name' => 'منتج', 'category' => 'أثاث', 'price' => 12000, 'reward_points' => 12, 'is_available' => true, 'is_featured' => false, 'store_id' => 999999];
        $this->actingAs($user)->post('/products', [...$data, 'image' => 'javascript:alert(1)'])->assertSessionHasErrors('image');
        $this->post('/products', $data)->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('products', ['name' => 'منتج', 'store_id' => $store->id]);
    }
}
