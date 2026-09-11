<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StorefrontController extends Controller
{
    public function show(Store $store)
    {
        abort_unless($store->is_published, 404);

        return Inertia::render('Storefront', [
            'store' => $store->only('name', 'slug', 'description', 'tagline', 'currency', 'city', 'hero_image', 'accent', 'theme', 'delivery_fee', 'whatsapp_phone'),
            'products' => $store->products()->where('is_available', true)->orderByDesc('is_featured')->latest()->get([
                'id', 'name', 'description', 'category', 'price', 'compare_price', 'image', 'reward_points', 'is_featured',
            ]),
            'rewards' => $store->rewards()->where('is_active', true)->where(fn ($q) => $q->whereNull('stock')->orWhere('stock', '>', 0))->orderBy('points_cost')->get(['id', 'name', 'description', 'image', 'points_cost']),
        ]);
    }

    public function checkout(Request $request, Store $store)
    {
        abort_unless($store->is_published, 404);
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'min:2', 'max:100'],
            'customer_phone' => ['required', 'regex:/^\+?[0-9]{8,15}$/'],
            'fulfillment' => ['required', 'in:delivery,pickup'],
            'address' => ['nullable', 'required_if:fulfillment,delivery', 'string', 'max:500'],
            'note' => ['nullable', 'string', 'max:1000'],
            'idempotency_key' => ['required', 'uuid'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.product_id' => ['required', 'integer', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);
        // Bind retry keys to this session; never reveal an order using a client key alone.
        $sessionKey = 'checkout.'.$store->id.'.'.$data['idempotency_key'];
        if ($token = $request->session()->get($sessionKey)) {
            return to_route('order.confirmation', $token);
        }
        $order = DB::transaction(function () use ($store, $data) {
            $lockedStore = Store::query()->lockForUpdate()->findOrFail($store->id);
            abort_unless($lockedStore->is_published, 404);
            if (! $lockedStore->whatsapp_phone) {
                throw ValidationException::withMessages(['items' => 'المتجر لم يفعّل استقبال الطلبات بعد.']);
            }
            if ($lockedStore->orders()->where('idempotency_key', $data['idempotency_key'])->exists()) {
                throw ValidationException::withMessages(['items' => 'تم استخدام رقم المحاولة. حدّث الصفحة قبل المحاولة مجدداً.']);
            }
            $products = $lockedStore->products()->where('is_available', true)
                ->whereIn('id', array_column($data['items'], 'product_id'))->lockForUpdate()->get()->keyBy('id');
            $items = [];
            $subtotal = 0;
            $points = 0;
            foreach ($data['items'] as $line) {
                $product = $products->get($line['product_id']);
                if (! $product) {
                    throw ValidationException::withMessages(['items' => 'أحد المنتجات لم يعد متاحاً. حدّث المتجر وراجع السلة.']);
                }
                $items[] = ['product_id' => $product->id, 'name' => $product->name, 'price' => $product->price, 'quantity' => $line['quantity']];
                $subtotal += $product->price * $line['quantity'];
                $points += $product->reward_points * $line['quantity'];
            }
            $delivery = $data['fulfillment'] === 'delivery' ? $lockedStore->delivery_fee : 0;
            $order = $lockedStore->orders()->create([
                'token' => (string) Str::uuid(), 'idempotency_key' => $data['idempotency_key'],
                'customer_name' => $data['customer_name'], 'customer_phone' => $data['customer_phone'],
                'fulfillment' => $data['fulfillment'], 'address' => $data['fulfillment'] === 'delivery' ? $data['address'] : null,
                'note' => $data['note'] ?? null, 'currency' => $lockedStore->currency,
                'subtotal' => $subtotal, 'delivery_fee' => $delivery, 'total' => $subtotal + $delivery,
                'reward_points' => $points,
            ]);
            $order->items()->createMany($items);

            return $order;
        });
        $request->session()->put($sessionKey, $order->token);
        $request->session()->put('order_access.'.$order->token, true);

        return to_route('order.confirmation', $order->token);
    }

    public function confirmation(Request $request, string $token)
    {
        abort_unless($request->session()->get('order_access.'.$token), 404);
        $order = Order::where('token', $token)->with('items')->firstOrFail();
        $store = Store::findOrFail($order->store_id);
        $money = fn ($amount) => number_format($amount / 100, 2).' '.$order->currency;
        $message = 'مرحباً '.$store->name.'، أود تأكيد الطلب #'.$order->id."\n";
        foreach ($order->items as $item) {
            $message .= $item->name.' × '.$item->quantity.' — '.$money($item->price * $item->quantity)."\n";
        }
        $message .= 'التوصيل: '.$money($order->delivery_fee)."\n".'الإجمالي: '.$money($order->total)."\n";
        $message .= 'الاسم: '.$order->customer_name."\n".'الجوال: '.$order->customer_phone."\n";
        $message .= $order->fulfillment === 'delivery' ? 'العنوان: '.$order->address : 'استلام من المتجر';
        if ($order->note) {
            $message .= "\nملاحظات: ".$order->note;
        }

        return Inertia::render('Confirmation', [
            'order' => $order, 'store' => $store->only('name', 'slug'),
            'whatsappUrl' => 'https://wa.me/'.$store->whatsapp_phone.'?text='.rawurlencode($message),
        ]);
    }
}
