<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('phone', 20);
            $table->string('phone_key', 20);
            $table->string('email')->nullable();
            $table->unsignedBigInteger('points_balance')->default(0);
            $table->timestamps();
            $table->unique(['store_id', 'phone_key']);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->constrained()->restrictOnDelete();
        });
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->string('image', 500)->nullable();
            $table->unsignedInteger('points_cost');
            $table->unsignedInteger('stock')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('revision')->default(0);
            $table->timestamps();
        });
        Schema::create('point_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('order_id')->nullable()->unique()->constrained()->restrictOnDelete();
            $table->foreignId('reward_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('idempotency_key');
            $table->string('kind', 20);
            $table->bigInteger('delta');
            $table->unsignedBigInteger('balance_after');
            $table->string('description', 500);
            $table->timestamps();
            $table->unique(['store_id', 'idempotency_key']);
            $table->index(['customer_id', 'id']);
        });
        Schema::create('customer_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_notes');
        Schema::dropIfExists('point_entries');
        Schema::dropIfExists('rewards');
        Schema::table('orders', fn (Blueprint $table) => $table->dropConstrainedForeignId('customer_id'));
        Schema::dropIfExists('customers');
    }
};
