<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CommerceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function store(): Store
    {
        return Store::create(['user_id' => User::factory()->create()->id, 'name' => 'دار', 'slug' => Str::random(12), 'is_published' => true, 'whatsapp_phone' => '970599000000', 'delivery_fee' => 2000]);
    }

    private function payload($product): array
    {
        return ['customer_name' => 'عميل تجريبي', 'customer_phone' => '0599000000', 'fulfillment' => 'delivery', 'address' => 'رام الله، شارع الإرسال', 'idempotency_key' => (string) Str::uuid(), 'items' => [['product_id' => $product->id, 'quantity' => 2]]];
    }

    public function test_checkout_uses_server_prices_and_is_idempotent(): void
    {
        $store = $this->store();
        $product = $store->products()->create(['name' => 'إناء', 'price' => 8500, 'reward_points' => 8]);
        $payload = [...$this->payload($product), 'total' => 1, 'reward_points' => 99999];
        $response = $this->post('/s/'.$store->slug.'/checkout', $payload)->assertRedirect();
        $order = $store->orders()->firstOrFail();
        $this->assertSame(19000, $order->total);
        $this->assertSame(16, $order->reward_points);
        $this->assertNull($order->points_awarded_at);
        $this->assertCount(1, $order->items);
        $this->post('/s/'.$store->slug.'/checkout', $payload)->assertRedirect($response->headers->get('Location'));
        $this->assertDatabaseCount('orders', 1);
        $this->get($response->headers->get('Location'))->assertOk();
    }

    public function test_cross_store_product_is_rejected_and_no_partial_order_is_saved(): void
    {
        $store = $this->store();
        $other = $this->store();
        $product = $other->products()->create(['name' => 'خاص بمتجر آخر', 'price' => 100]);
        $this->post('/s/'.$store->slug.'/checkout', $this->payload($product))->assertSessionHasErrors('items');
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
    }

    public function test_unpublished_store_is_not_public(): void
    {
        $store = $this->store();
        $store->update(['is_published' => false]);
        $this->get('/s/'.$store->slug)->assertNotFound();
        $this->post('/s/'.$store->slug.'/checkout', [])->assertNotFound();
    }

    public function test_invalid_and_unavailable_items_cannot_be_ordered(): void
    {
        $store = $this->store();
        $product = $store->products()->create(['name' => 'مخفي', 'price' => 100, 'is_available' => false]);
        $this->post('/s/'.$store->slug.'/checkout', $this->payload($product))->assertSessionHasErrors('items');
        $product->update(['is_available' => true]);
        $payload = $this->payload($product);
        $payload['items'][0]['quantity'] = -2;
        $this->post('/s/'.$store->slug.'/checkout', $payload)->assertSessionHasErrors('items.0.quantity');
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_pickup_has_no_delivery_fee(): void
    {
        $store = $this->store();
        $product = $store->products()->create(['name' => 'منتج', 'price' => 100]);
        $this->post('/s/'.$store->slug.'/checkout', [...$this->payload($product), 'fulfillment' => 'pickup', 'address' => null])->assertRedirect();
        $this->assertDatabaseHas('orders', ['total' => 200, 'delivery_fee' => 0, 'address' => null]);
    }

    public function test_merchant_cannot_update_another_merchants_product_or_order(): void
    {
        $store = $this->store();
        $other = $this->store();
        $product = $store->products()->create(['name' => 'منتج', 'price' => 100]);
        $this->post('/s/'.$store->slug.'/checkout', $this->payload($product));
        $order = $store->orders()->firstOrFail();
        $this->actingAs(User::find($other->user_id))->put('/products/'.$product->id, [])->assertNotFound();
        $this->patch('/orders/'.$order->id, ['status' => 'confirmed'])->assertNotFound();
    }

    public function test_delivered_order_cannot_be_reopened_and_points_timestamp_is_stable(): void
    {
        $store = $this->store();
        $product = $store->products()->create(['name' => 'منتج', 'price' => 100]);
        $this->post('/s/'.$store->slug.'/checkout', $this->payload($product));
        $order = $store->orders()->firstOrFail();
        $this->actingAs(User::find($store->user_id));
        foreach (['confirmed', 'preparing', 'delivered'] as $status) {
            $this->patch('/orders/'.$order->id, ['status' => $status])->assertRedirect();
        }
        $awarded = $order->fresh()->points_awarded_at;
        $this->assertNotNull($awarded);
        $this->travel(1)->hours();
        $this->patch('/orders/'.$order->id, ['status' => 'delivered'])->assertRedirect();
        $this->assertTrue($awarded->equalTo($order->fresh()->points_awarded_at));
        $this->patch('/orders/'.$order->id, ['status' => 'new'])->assertStatus(422);
    }

    public function test_registration_creates_private_store_and_authenticates_owner(): void
    {
        $this->post('/register', ['name' => 'تاجر', 'store_name' => 'متجري', 'email' => 'merchant@example.test', 'password' => 'LongPassword123!', 'password_confirmation' => 'LongPassword123!'])->assertRedirect('/store');
        $this->assertAuthenticated();
        $this->assertDatabaseHas('stores', ['name' => 'متجري', 'is_published' => false]);
        $this->get('/dashboard')->assertOk();
        $this->get('/products')->assertOk();
        $this->post('/logout')->assertRedirect('/');
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_order_confirmation_requires_the_creating_session(): void
    {
        $store = $this->store();
        $product = $store->products()->create(['name' => 'منتج', 'price' => 100]);
        $this->post('/s/'.$store->slug.'/checkout', $this->payload($product));
        $order = $store->orders()->firstOrFail();
        session()->flush();
        $this->get('/orders/confirmation/'.$order->token)->assertNotFound();
    }
}
