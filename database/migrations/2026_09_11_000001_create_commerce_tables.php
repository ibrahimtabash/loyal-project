<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('tagline')->default('تفاصيل صغيرة، تصنع فرقاً كبيراً.');
            $table->string('whatsapp_phone')->nullable();
            $table->string('currency', 3)->default('ILS');
            $table->string('city')->nullable();
            $table->string('hero_image')->nullable();
            $table->string('accent', 7)->default('#243d32');
            $table->unsignedInteger('delivery_fee')->default(0);
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->default('المجموعة');
            $table->unsignedInteger('price');
            $table->unsignedInteger('compare_price')->nullable();
            $table->string('image')->nullable();
            $table->unsignedInteger('reward_points')->default(0);
            $table->boolean('is_available')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
            $table->index(['store_id', 'is_available']);
        });
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('token')->unique();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->uuid('idempotency_key');
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('fulfillment');
            $table->text('address')->nullable();
            $table->text('note')->nullable();
            $table->string('currency', 3);
            $table->unsignedBigInteger('subtotal');
            $table->unsignedInteger('delivery_fee');
            $table->unsignedBigInteger('total');
            $table->unsignedInteger('reward_points')->default(0);
            $table->string('status')->default('new');
            $table->timestamp('points_awarded_at')->nullable();
            $table->timestamps();
            $table->unique(['store_id', 'idempotency_key']);
            $table->index(['store_id', 'status']);
        });
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->unsignedInteger('price');
            $table->unsignedInteger('quantity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('products');
        Schema::dropIfExists('stores');
    }
};
