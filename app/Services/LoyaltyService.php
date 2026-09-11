<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\PointEntry;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoyaltyService
{
    public function transitionOrder(int $storeId, int $orderId, string $status, int $actorId): void
    {
        DB::transaction(function () use ($storeId, $orderId, $status, $actorId) {
            $store = Store::query()->lockForUpdate()->findOrFail($storeId);
            $order = $store->orders()->lockForUpdate()->findOrFail($orderId);
            $allowed = ['new' => ['confirmed', 'canceled'], 'confirmed' => ['preparing', 'canceled'], 'preparing' => ['delivered', 'canceled'], 'delivered' => [], 'canceled' => []];
            abort_unless($order->status === $status || in_array($status, $allowed[$order->status] ?? []), 422, 'لا يمكن تغيير حالة هذا الطلب.');
            $order->update(['status' => $status]);
            $this->syncLockedOrder($store, $order, $actorId);
        }, 3);
    }

    public function syncOrder(int $storeId, int $orderId): void
    {
        DB::transaction(function () use ($storeId, $orderId) {
            $store = Store::query()->lockForUpdate()->findOrFail($storeId);
            $order = $store->orders()->lockForUpdate()->findOrFail($orderId);
            $this->syncLockedOrder($store, $order, null);
        }, 3);
    }

    private function syncLockedOrder(Store $store, Order $order, ?int $actorId): void
    {
        if (! in_array($order->status, ['confirmed', 'preparing', 'delivered'])) {
            return;
        }
        $customer = $order->customer_id
            ? $store->customers()->lockForUpdate()->findOrFail($order->customer_id)
            : $store->customers()->firstOrCreate(['phone_key' => Customer::phoneKey($order->customer_phone)], ['name' => $order->customer_name, 'phone' => $order->customer_phone]);
        if (! $order->customer_id) {
            $order->update(['customer_id' => $customer->id]);
        }
        if ($order->status !== 'delivered') {
            return;
        }
        // Older releases already set points_awarded_at without a wallet. The unique order entry is authoritative.
        if (! $store->pointEntries()->where('order_id', $order->id)->exists()) {
            $this->append($store, $customer, $order->reward_points, 'earn', 'نقاط الطلب #'.$order->id, (string) Str::uuid(), $actorId, $order->id);
        }
        if (! $order->points_awarded_at) {
            $order->update(['points_awarded_at' => now()]);
        }
    }

    public function adjust(int $storeId, int $customerId, int $delta, string $reason, string $key, int $actorId): void
    {
        DB::transaction(function () use ($storeId, $customerId, $delta, $reason, $key, $actorId) {
            $store = Store::query()->lockForUpdate()->findOrFail($storeId);
            $customer = $store->customers()->lockForUpdate()->findOrFail($customerId);
            if ($entry = $store->pointEntries()->where('idempotency_key', $key)->first()) {
                $this->requireSameRetry($entry->kind === 'adjustment' && $entry->customer_id === $customerId && $entry->delta === $delta && $entry->description === $reason);

                return;
            }
            $this->append($store, $customer, $delta, 'adjustment', $reason, $key, $actorId);
        }, 3);
    }

    public function redeem(int $storeId, int $customerId, int $rewardId, string $key, int $actorId, int $rewardVersion): void
    {
        DB::transaction(function () use ($storeId, $customerId, $rewardId, $key, $actorId, $rewardVersion) {
            // All balance/stock mutations use the same store-first lock order.
            $store = Store::query()->lockForUpdate()->findOrFail($storeId);
            $customer = $store->customers()->lockForUpdate()->findOrFail($customerId);
            $reward = $store->rewards()->lockForUpdate()->findOrFail($rewardId);
            if ($entry = $store->pointEntries()->where('idempotency_key', $key)->first()) {
                $this->requireSameRetry($entry->kind === 'redemption' && $entry->customer_id === $customerId && $entry->reward_id === $rewardId);

                return;
            }
            if (! $reward->is_active || $reward->stock === 0) {
                throw ValidationException::withMessages(['reward_id' => 'هذه المكافأة غير متاحة حالياً.']);
            }
            if ($reward->revision !== $rewardVersion) {
                throw ValidationException::withMessages(['reward_id' => 'تغيّرت تفاصيل المكافأة. راجع التكلفة والكمية المحدّثة ثم أكّد من جديد.']);
            }
            $this->append($store, $customer, -$reward->points_cost, 'redemption', 'استبدال: '.$reward->name, $key, $actorId, null, $rewardId);
            $reward->update(['stock' => $reward->stock === null ? null : $reward->stock - 1, 'revision' => $reward->revision + 1]);
        }, 3);
    }

    private function requireSameRetry(bool $matches): void
    {
        if (! $matches) {
            throw ValidationException::withMessages(['idempotency_key' => 'هذه المحاولة مستخدمة لعملية مختلفة. أعد فتح النموذج.']);
        }
    }

    private function append(Store $store, Customer $customer, int $delta, string $kind, string $description, string $key, ?int $actorId, ?int $orderId = null, ?int $rewardId = null): PointEntry
    {
        $balance = $customer->points_balance + $delta;
        if ($balance < 0) {
            throw ValidationException::withMessages(['points' => 'رصيد العميل لا يكفي لإتمام العملية.']);
        }
        if ($balance > 1_000_000_000_000) {
            throw ValidationException::withMessages(['points' => 'تجاوزت العملية الحد المسموح لرصيد النقاط.']);
        }
        $entry = $store->pointEntries()->create([
            'customer_id' => $customer->id, 'order_id' => $orderId, 'reward_id' => $rewardId,
            'actor_id' => $actorId, 'idempotency_key' => $key, 'kind' => $kind,
            'delta' => $delta, 'balance_after' => $balance, 'description' => $description,
        ]);
        $customer->update(['points_balance' => $balance]);

        return $entry;
    }
}
