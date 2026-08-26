<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitor_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_monitor_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('type', 30);
            $table->string('operator', 20);
            $table->string('value');
            $table->unsignedInteger('cooldown_seconds')->default(300);
            $table->boolean('is_active')->default(true);
            $table->string('state', 20)->default('ok');
            $table->timestamp('last_triggered_at')->nullable();
            $table->timestamp('last_resolved_at')->nullable();
            $table->timestamps();

            $table->index(['api_monitor_id', 'is_active']);
            $table->index(['api_monitor_id', 'state']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitor_alerts');
    }
};
