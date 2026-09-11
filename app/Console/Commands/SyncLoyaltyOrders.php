<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\LoyaltyService;
use Illuminate\Console\Command;

class SyncLoyaltyOrders extends Command
{
    protected $signature = 'loyalty:sync-orders {--store= : Optional numeric store ID}';

    protected $description = 'Attach existing confirmed orders to customers and credit delivered orders once.';

    public function handle(LoyaltyService $loyalty): int
    {
        if ($this->option('store') !== null && (! ctype_digit($this->option('store')) || (int) $this->option('store') < 1)) {
            $this->error('Provide a positive numeric store ID.');

            return self::FAILURE;
        }
        $query = Order::whereIn('status', ['confirmed', 'preparing', 'delivered'])->where(function ($q) {
            $q->whereNull('customer_id')->orWhere(function ($q) {
                $q->where('status', 'delivered')->whereNotExists(fn ($entries) => $entries->selectRaw('1')->from('point_entries')->whereColumn('point_entries.order_id', 'orders.id'));
            });
        });
        if ($this->option('store')) {
            $query->where('store_id', (int) $this->option('store'));
        }
        $count = 0;
        $query->chunkById(100, function ($orders) use ($loyalty, &$count) {
            foreach ($orders as $order) {
                $loyalty->syncOrder($order->store_id, $order->id);
                $count++;
            }
        });
        $this->info("Synchronized {$count} orders. Existing ledger credits were preserved.");

        return self::SUCCESS;
    }
}
