<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Rules\StoreImage;
use App\Services\LoyaltyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class MerchantController extends Controller
{
    private function store(Request $request): Store
    {
        return Store::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function index(Request $request)
    {
        $store = $this->store($request);

        return Inertia::render('Merchant', [
            'section' => $request->route()->getName(), 'store' => $store,
            'products' => $store->products()->latest()->get(),
            'orders' => $store->orders()->with('items')->latest()->paginate(30),
            'stats' => [
                'orders' => $store->orders()->count(),
                'new_orders' => $store->orders()->where('status', 'new')->count(),
                'revenue' => $store->orders()->where('status', 'delivered')->sum('total'),
                'customers' => $store->customers()->count(),
            ],
        ]);
    }

    public function updateStore(Request $request)
    {
        $store = $this->store($request);
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => ['required', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'max:80', Rule::unique('stores')->ignore($store->id)],
            'tagline' => 'required|string|max:160', 'description' => 'nullable|string|max:2000',
            'city' => 'nullable|string|max:100', 'currency' => 'required|in:ILS,JOD,USD,SAR,AED',
            'whatsapp_phone' => ['nullable', 'required_if:is_published,true,1', 'regex:/^[1-9][0-9]{7,14}$/'],
            'delivery_fee' => 'required|integer|min:0|max:100000',
            'accent' => ['required', 'regex:/^#[a-fA-F0-9]{6}$/'],
            'theme' => ['required', Rule::in(Store::THEMES)],
            'hero_image' => ['nullable', 'string', 'max:500', new StoreImage($store->id)], 'is_published' => 'required|boolean',
        ]);
        DB::transaction(function () use ($store, $data) {
            $locked = Store::query()->lockForUpdate()->findOrFail($store->id);
            if ($data['currency'] !== $locked->currency && ($locked->products()->exists() || $locked->orders()->exists())) {
                throw ValidationException::withMessages([
                    'currency' => 'حدّد العملة قبل إضافة المنتجات. لا يمكن تغييرها بعد وجود منتجات أو طلبات حتى تبقى الأسعار والتقارير صحيحة.',
                ]);
            }
            $locked->update($data);
        });

        return back()->with('success', 'تم حفظ إعدادات المتجر.');
    }

    public function saveProduct(Request $request, ?int $product = null)
    {
        $store = $this->store($request);
        $existing = $product ? $store->products()->findOrFail($product) : null;
        $data = $request->validate([
            'name' => 'required|string|max:160', 'description' => 'nullable|string|max:3000',
            'category' => 'required|string|max:80', 'price' => 'required|integer|min:1|max:10000000',
            'compare_price' => 'nullable|integer|gt:price|max:10000000',
            'image' => ['nullable', 'string', 'max:500', new StoreImage($store->id)], 'reward_points' => 'required|integer|min:0|max:10000',
            'is_available' => 'required|boolean', 'is_featured' => 'required|boolean',
        ]);
        DB::transaction(function () use ($store, $existing, $data) {
            Store::query()->lockForUpdate()->findOrFail($store->id);
            $existing ? $existing->update($data) : $store->products()->create($data);
        });

        return back()->with('success', 'تم حفظ المنتج.');
    }

    public function updateOrder(Request $request, int $order, LoyaltyService $loyalty)
    {
        $store = $this->store($request);
        $data = $request->validate(['status' => 'required|in:new,confirmed,preparing,delivered,canceled']);
        $loyalty->transitionOrder($store->id, $order, $data['status'], $request->user()->id);

        return back()->with('success', 'تم تحديث حالة الطلب.');
    }
}
