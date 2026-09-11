<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\PointEntry;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LoyaltyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function store(): Store
    {
        return Store::create(['user_id' => User::factory()->create()->id, 'name' => 'متجر', 'slug' => Str::lower(Str::random(12)), 'is_published' => true]);
    }

    private function customer(Store $store): Customer
    {
        return $store->customers()->create(['name' => 'عميل', 'phone' => '+970599000000', 'phone_key' => '970599000000']);
    }

    private function order(Store $store, array $overrides = []): Order
    {
        return $store->orders()->create([...[
            'token' => (string) Str::uuid(), 'idempotency_key' => (string) Str::uuid(),
            'customer_name' => 'عميل طلب', 'customer_phone' => '+970599000000',
            'fulfillment' => 'pickup', 'currency' => 'ILS', 'subtotal' => 10000, 'delivery_fee' => 0, 'total' => 10000,
            'reward_points' => 100, 'status' => 'new',
        ], ...$overrides]);
    }

    private function owner(Store $store): void
    {
        $this->actingAs(User::findOrFail($store->user_id));
    }

    private function credit(Store $store, Customer $customer, int $amount = 100): void
    {
        $this->owner($store);
        $this->post('/customers/'.$customer->id.'/points', ['delta' => $amount, 'reason' => 'رصيد افتتاحي للتجربة', 'idempotency_key' => (string) Str::uuid()])->assertSessionHasNoErrors();
    }

    private function redemption($reward, array $overrides = []): array
    {
        return [...['reward_id' => $reward->id, 'reward_version' => $reward->revision, 'idempotency_key' => (string) Str::uuid(), 'confirmed' => true], ...$overrides];
    }

    public function test_only_delivered_orders_credit_the_customer_once(): void
    {
        $store = $this->store();
        $order = $this->order($store);
        $this->owner($store);
        $this->assertDatabaseCount('customers', 0);
        $this->patch('/orders/'.$order->id, ['status' => 'confirmed'])->assertRedirect();
        $customer = $store->customers()->firstOrFail();
        $this->assertSame(0, $customer->points_balance);
        $this->assertSame($customer->id, $order->fresh()->customer_id);
        $this->assertDatabaseCount('point_entries', 0);
        $this->patch('/orders/'.$order->id, ['status' => 'preparing'])->assertRedirect();
        $this->patch('/orders/'.$order->id, ['status' => 'delivered'])->assertRedirect();
        $this->patch('/orders/'.$order->id, ['status' => 'delivered'])->assertRedirect();
        $this->assertSame(100, $customer->fresh()->points_balance);
        $this->assertDatabaseCount('point_entries', 1);
        $this->assertDatabaseHas('point_entries', ['order_id' => $order->id, 'kind' => 'earn', 'delta' => 100, 'actor_id' => $store->user_id]);
    }

    public function test_cancellation_does_not_award_points(): void
    {
        $store = $this->store();
        $order = $this->order($store);
        $this->owner($store);
        $this->patch('/orders/'.$order->id, ['status' => 'confirmed']);
        $this->patch('/orders/'.$order->id, ['status' => 'canceled'])->assertRedirect();
        $this->assertSame(0, $store->customers()->firstOrFail()->points_balance);
        $this->assertDatabaseCount('point_entries', 0);
    }

    public function test_backfill_preserves_old_timestamps_and_does_not_double_credit(): void
    {
        $store = $this->store();
        $order = $this->order($store, ['status' => 'delivered', 'points_awarded_at' => now()->subDays(2)]);
        $timestamp = $order->points_awarded_at;
        $this->artisan('loyalty:sync-orders')->assertSuccessful();
        $this->artisan('loyalty:sync-orders')->assertSuccessful();
        $this->assertDatabaseCount('customers', 1);
        $this->assertDatabaseCount('point_entries', 1);
        $this->assertSame(100, $store->customers()->firstOrFail()->points_balance);
        $this->assertTrue($timestamp->equalTo($order->fresh()->points_awarded_at));
        $this->assertSame(100, (int) PointEntry::sum('delta'));
    }

    public function test_redemption_uses_server_cost_and_retry_does_not_spend_twice(): void
    {
        $store = $this->store();
        $customer = $this->customer($store);
        $this->credit($store, $customer);
        $reward = $store->rewards()->create(['name' => 'هدية', 'points_cost' => 70, 'stock' => 1])->fresh();
        $payload = $this->redemption($reward, ['points_cost' => 1, 'points_balance' => 9999]);
        $this->post('/customers/'.$customer->id.'/redeem', $payload)->assertSessionHasNoErrors()->assertRedirect();
        $this->post('/customers/'.$customer->id.'/redeem', $payload)->assertSessionHasNoErrors()->assertRedirect();
        $this->assertSame(30, $customer->fresh()->points_balance);
        $this->assertSame(0, $reward->fresh()->stock);
        $this->assertSame(1, $store->pointEntries()->where('kind', 'redemption')->count());
        $this->assertDatabaseHas('point_entries', ['customer_id' => $customer->id, 'reward_id' => $reward->id, 'delta' => -70, 'balance_after' => 30]);
    }

    public function test_insufficient_balance_and_unavailable_rewards_leave_no_partial_write(): void
    {
        $store = $this->store();
        $customer = $this->customer($store);
        $this->credit($store, $customer, 20);
        $reward = $store->rewards()->create(['name' => 'هدية', 'points_cost' => 70, 'stock' => 1])->fresh();
        $this->post('/customers/'.$customer->id.'/redeem', $this->redemption($reward))->assertSessionHasErrors('points');
        $this->assertSame(1, $reward->fresh()->stock);
        $this->assertSame(20, $customer->fresh()->points_balance);
        $this->assertSame(0, $store->pointEntries()->where('kind', 'redemption')->count());
        $reward->update(['is_active' => false]);
        $this->post('/customers/'.$customer->id.'/redeem', $this->redemption($reward))->assertSessionHasErrors('reward_id');
    }

    public function test_rewards_require_explicit_fulfillment_confirmation(): void
    {
        $store = $this->store();
        $customer = $this->customer($store);
        $this->credit($store, $customer);
        $reward = $store->rewards()->create(['name' => 'هدية', 'points_cost' => 70])->fresh();
        $this->post('/customers/'.$customer->id.'/redeem', $this->redemption($reward, ['confirmed' => false]))->assertSessionHasErrors('confirmed');
        $this->assertSame(100, $customer->fresh()->points_balance);
    }

    public function test_a_second_request_cannot_overdraw_the_remaining_balance(): void
    {
        $store = $this->store();
        $customer = $this->customer($store);
        $this->credit($store, $customer);
        $reward = $store->rewards()->create(['name' => 'هدية', 'points_cost' => 70, 'stock' => 2])->fresh();
        $this->post('/customers/'.$customer->id.'/redeem', $this->redemption($reward))->assertSessionHasNoErrors();
        $this->post('/customers/'.$customer->id.'/redeem', $this->redemption($reward->fresh()))->assertSessionHasErrors('points');
        $this->assertSame(30, $customer->fresh()->points_balance);
        $this->assertSame(1, $reward->fresh()->stock);
    }

    public function test_reward_versions_prevent_stale_cost_acceptance_and_lost_stock_updates(): void
    {
        $store = $this->store();
        $customer = $this->customer($store);
        $this->credit($store, $customer, 300);
        $reward = $store->rewards()->create(['name' => 'هدية', 'points_cost' => 70, 'stock' => 2])->fresh();
        $payload = $this->redemption($reward);
        $this->put('/rewards/'.$reward->id, ['name' => 'هدية', 'points_cost' => 90, 'stock' => 2, 'is_active' => true, 'revision' => 0])->assertSessionHasNoErrors();
        $this->post('/customers/'.$customer->id.'/redeem', $payload)->assertSessionHasErrors('reward_id');
        $this->assertSame(300, $customer->fresh()->points_balance);
        $this->post('/customers/'.$customer->id.'/redeem', $this->redemption($reward->fresh()))->assertSessionHasNoErrors();
        $this->put('/rewards/'.$reward->id, ['name' => 'اسم جديد', 'points_cost' => 90, 'stock' => 2, 'is_active' => true, 'revision' => 1])->assertSessionHasErrors('stock');
        $this->assertSame(1, $reward->fresh()->stock);
        $this->assertSame('هدية', $reward->fresh()->name);
    }

    public function test_adjustments_are_audited_idempotent_and_cannot_make_a_negative_balance(): void
    {
        $store = $this->store();
        $customer = $this->customer($store);
        $this->owner($store);
        $payload = ['delta' => 50, 'reason' => 'تصحيح رصيد سابق', 'idempotency_key' => (string) Str::uuid()];
        $this->post('/customers/'.$customer->id.'/points', $payload)->assertSessionHasNoErrors();
        $this->post('/customers/'.$customer->id.'/points', $payload)->assertSessionHasNoErrors();
        $this->post('/customers/'.$customer->id.'/points', [...$payload, 'delta' => 60])->assertSessionHasErrors('idempotency_key');
        $this->post('/customers/'.$customer->id.'/points', [...$payload, 'delta' => -51, 'idempotency_key' => (string) Str::uuid()])->assertSessionHasErrors('points');
        $this->assertSame(50, $customer->fresh()->points_balance);
        $this->assertDatabaseCount('point_entries', 1);
        $this->assertDatabaseHas('point_entries', ['actor_id' => $store->user_id, 'description' => 'تصحيح رصيد سابق', 'delta' => 50]);
    }

    public function test_customer_and_reward_access_is_isolated_between_stores(): void
    {
        $own = $this->store();
        $other = $this->store();
        $customer = $this->customer($own);
        $otherCustomer = $this->customer($other);
        $reward = $other->rewards()->create(['name' => 'مكافأة خاصة', 'points_cost' => 10])->fresh();
        $this->credit($own, $customer);
        $this->get('/customers/'.$otherCustomer->id)->assertNotFound();
        $this->put('/customers/'.$otherCustomer->id, ['name' => 'اختراق'])->assertNotFound();
        $this->post('/customers/'.$otherCustomer->id.'/notes', ['body' => 'ملاحظة'])->assertNotFound();
        $this->post('/customers/'.$otherCustomer->id.'/points', ['delta' => 10])->assertNotFound();
        $this->post('/customers/'.$customer->id.'/redeem', $this->redemption($reward))->assertNotFound();
        $this->put('/rewards/'.$reward->id, [])->assertNotFound();
        $this->assertSame(100, $customer->fresh()->points_balance);
        $this->assertDatabaseCount('customer_notes', 0);
    }

    public function test_public_catalog_exposes_only_available_rewards_and_no_wallet_data(): void
    {
        $store = $this->store();
        $this->customer($store);
        $store->rewards()->create(['name' => 'هدية متاحة', 'points_cost' => 100]);
        $store->rewards()->create(['name' => 'هدية مخفية', 'points_cost' => 20, 'is_active' => false]);
        $store->rewards()->create(['name' => 'هدية نافدة', 'points_cost' => 30, 'stock' => 0]);
        $this->get('/s/'.$store->slug)->assertInertia(fn (Assert $page) => $page->component('Storefront')->has('rewards', 1)->where('rewards.0.name', 'هدية متاحة')->missing('rewards.0.store_id')->missing('customers')->missing('entries'));
        $this->get('/customers')->assertRedirect('/login');
        $this->get('/rewards')->assertRedirect('/login');
    }

    public function test_customer_identity_is_not_overwritten_by_an_order_and_notes_are_private(): void
    {
        $store = $this->store();
        $customer = $this->customer($store);
        $this->owner($store);
        $this->post('/customers', ['name' => 'تكرار', 'phone' => '00970599000000'])->assertSessionHasErrors('phone');
        $order = $this->order($store, ['customer_phone' => '970599000000', 'customer_name' => 'اسم من طلب غير موثّق']);
        $this->patch('/orders/'.$order->id, ['status' => 'confirmed']);
        $this->assertDatabaseCount('customers', 1);
        $this->assertSame('عميل', $customer->fresh()->name);
        $this->put('/customers/'.$customer->id, ['name' => 'عميل جديد', 'points_balance' => 9999])->assertSessionHasNoErrors();
        $this->assertSame(0, $customer->fresh()->points_balance);
        $this->post('/customers/'.$customer->id.'/notes', ['body' => 'يفضل التواصل مساء'])->assertSessionHasNoErrors();
        $this->get('/customers/'.$customer->id)->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->get('/customers?q='.urlencode('عميل جديد'))->assertInertia(fn (Assert $page) => $page->component('Customers')->has('customers.data', 1));
    }

    public function test_point_history_cannot_be_overwritten_through_models(): void
    {
        $store = $this->store();
        $customer = $this->customer($store);
        $this->credit($store, $customer);
        $entry = $customer->entries()->firstOrFail();
        $this->expectException(\LogicException::class);
        $entry->update(['delta' => 999]);
    }
}
