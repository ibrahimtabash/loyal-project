<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Store;
use App\Rules\StoreImage;
use App\Services\LoyaltyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LoyaltyController extends Controller
{
    private function store(Request $request): Store
    {
        return Store::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function customers(Request $request)
    {
        $store = $this->store($request);
        $filters = $request->validate(['q' => 'nullable|string|max:100', 'filter' => 'nullable|in:all,with_points,repeat']);
        $query = $store->customers()->withCount('orders')->withMax('orders', 'created_at');
        if ($q = $filters['q'] ?? null) {
            $query->where(fn ($query) => $query->where('name', 'like', '%'.$q.'%')->orWhere('phone_key', 'like', '%'.Customer::phoneKey($q).'%'));
        }
        if (($filters['filter'] ?? '') === 'with_points') {
            $query->where('points_balance', '>', 0);
        }
        if (($filters['filter'] ?? '') === 'repeat') {
            $query->has('orders', '>=', 2);
        }

        return Inertia::render('Customers', [
            'store' => $store->only('name', 'slug', 'is_published', 'currency'),
            'customers' => $query->latest('updated_at')->orderByDesc('id')->paginate(20)->withQueryString(),
            'filters' => ['q' => $filters['q'] ?? '', 'filter' => $filters['filter'] ?? 'all'],
            'stats' => ['customers' => $store->customers()->count(), 'points' => (int) $store->customers()->sum('points_balance'), 'redemptions' => $store->pointEntries()->where('kind', 'redemption')->count()],
        ]);
    }

    public function customer(Request $request, int $customer)
    {
        $store = $this->store($request);
        $record = $store->customers()->findOrFail($customer);

        return Inertia::render('Customer', [
            'store' => $store->only('name', 'slug', 'is_published', 'currency'),
            'customer' => $record,
            'entries' => $record->entries()->orderByDesc('id')->paginate(15)->withQueryString(),
            'notes' => $record->notes()->latest('id')->paginate(10, ['*'], 'notes_page')->withQueryString(),
            'orders' => $record->orders()->latest('id')->limit(10)->get(['id', 'total', 'currency', 'status', 'created_at']),
            'stats' => ['orders' => $record->orders()->count(), 'spent' => (int) $record->orders()->where('status', 'delivered')->sum('total'), 'earned' => (int) $record->entries()->where('kind', 'earn')->sum('delta')],
            'rewards' => $store->rewards()->where('is_active', true)->where(fn ($q) => $q->whereNull('stock')->orWhere('stock', '>', 0))->orderBy('points_cost')->get(['id', 'name', 'points_cost', 'stock', 'image', 'revision']),
        ]);
    }

    public function saveCustomer(Request $request, ?int $customer = null)
    {
        $store = $this->store($request);
        if ($customer) {
            $store->customers()->findOrFail($customer);
        }
        $data = $request->validate(['name' => 'required|string|max:100', 'email' => 'nullable|email|max:255', 'phone' => $customer ? 'prohibited' : ['required', 'regex:/^\+?[0-9]{8,15}$/']]);
        $record = DB::transaction(function () use ($store, $customer, $data) {
            Store::query()->lockForUpdate()->findOrFail($store->id);
            if ($customer) {
                $record = $store->customers()->findOrFail($customer);
                $record->update(collect($data)->only('name', 'email')->all());

                return $record;
            }
            $key = Customer::phoneKey($data['phone']);
            if ($store->customers()->where('phone_key', $key)->exists()) {
                throw ValidationException::withMessages(['phone' => 'يوجد عميل بهذا الرقم في متجرك. ابحث عنه قبل إضافة حساب جديد.']);
            }

            return $store->customers()->create([...$data, 'phone_key' => $key]);
        });

        return to_route('customers.show', $record->id)->with('success', $customer ? 'تم تحديث بيانات العميل.' : 'تم إنشاء ملف العميل.');
    }

    public function note(Request $request, int $customer)
    {
        $record = $this->store($request)->customers()->findOrFail($customer);
        $data = $request->validate(['body' => 'required|string|max:2000']);
        $record->notes()->create([...$data, 'actor_id' => $request->user()->id]);

        return back()->with('success', 'تمت إضافة الملاحظة إلى ملف العميل.');
    }

    public function adjust(Request $request, int $customer, LoyaltyService $loyalty)
    {
        $store = $this->store($request);
        $store->customers()->findOrFail($customer);
        $data = $request->validate(['delta' => 'required|integer|between:-1000000,1000000|not_in:0', 'reason' => 'required|string|min:5|max:500', 'idempotency_key' => 'required|uuid']);
        $loyalty->adjust($store->id, $customer, $data['delta'], $data['reason'], $data['idempotency_key'], $request->user()->id);

        return back()->with('success', 'تم تسجيل تعديل النقاط في سجل العميل.');
    }

    public function redeem(Request $request, int $customer, LoyaltyService $loyalty)
    {
        $store = $this->store($request);
        $store->customers()->findOrFail($customer);
        $data = $request->validate(['reward_id' => 'required|integer', 'reward_version' => 'required|integer|min:0', 'idempotency_key' => 'required|uuid', 'confirmed' => 'required|accepted']);
        $loyalty->redeem($store->id, $customer, $data['reward_id'], $data['idempotency_key'], $request->user()->id, $data['reward_version']);

        return back()->with('success', 'تم الاستبدال وخصم النقاط وتحديث كمية المكافأة.');
    }

    public function rewards(Request $request)
    {
        $store = $this->store($request);

        return Inertia::render('Rewards', [
            'store' => $store->only('name', 'slug', 'is_published', 'currency'),
            'rewards' => $store->rewards()->latest('id')->paginate(12),
            'stats' => ['active' => $store->rewards()->where('is_active', true)->count(), 'redemptions' => $store->pointEntries()->where('kind', 'redemption')->count(), 'spent' => -(int) $store->pointEntries()->where('kind', 'redemption')->sum('delta')],
        ]);
    }

    public function saveReward(Request $request, ?int $reward = null)
    {
        $store = $this->store($request);
        if ($reward) {
            $store->rewards()->findOrFail($reward);
        }
        $data = $request->validate([
            'name' => 'required|string|max:160', 'description' => 'nullable|string|max:2000',
            'image' => ['nullable', 'string', 'max:500', new StoreImage($store->id)],
            'points_cost' => 'required|integer|min:1|max:1000000', 'stock' => 'nullable|integer|min:0|max:1000000', 'is_active' => 'required|boolean',
            'revision' => $reward ? 'required|integer|min:0' : 'sometimes|integer|min:0',
        ]);
        DB::transaction(function () use ($store, $reward, $data) {
            Store::query()->lockForUpdate()->findOrFail($store->id);
            if ($reward) {
                $record = $store->rewards()->findOrFail($reward);
                if ($record->revision !== $data['revision']) {
                    throw ValidationException::withMessages(['stock' => 'تغيّرت المكافأة منذ فتح النموذج. أغلقه وافتحه مجدداً حتى لا تُستبدل الكمية الحالية بقيمة قديمة.']);
                }
                $record->update([...$data, 'revision' => $record->revision + 1]);
            } else {
                $store->rewards()->create([...$data, 'revision' => 0]);
            }
        });

        return back()->with('success', 'تم حفظ المكافأة.');
    }
}
