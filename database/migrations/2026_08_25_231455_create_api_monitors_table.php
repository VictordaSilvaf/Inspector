<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('api_monitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('url');
            $table->string('http_method', 10)->default('GET');
            $table->string('auth_type', 20)->default('none');
            $table->text('auth_config')->nullable();
            $table->json('custom_headers')->nullable();
            $table->unsignedInteger('interval_seconds')->default(300);
            $table->unsignedSmallInteger('timeout_seconds')->default(10);
            $table->unsignedSmallInteger('expected_status_code')->default(200);
            $table->boolean('is_active')->default(true);
            $table->string('last_status', 20)->nullable();
            $table->unsignedInteger('last_response_time_ms')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->unsignedInteger('consecutive_failures')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
            $table->index('last_checked_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_monitors');
    }
};
