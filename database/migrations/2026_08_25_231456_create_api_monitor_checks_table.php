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
        Schema::create('api_monitor_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_monitor_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20);
            $table->unsignedSmallInteger('http_status_code')->nullable();
            $table->unsignedInteger('response_time_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('response_size_bytes')->nullable();
            $table->text('response_body_preview')->nullable();
            $table->string('triggered_by', 20)->default('scheduled');
            $table->timestamp('checked_at');
            $table->timestamps();

            $table->index(['api_monitor_id', 'checked_at']);
            $table->index('checked_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_monitor_checks');
    }
};
