<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_monitor_secrets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_monitor_id')->constrained()->cascadeOnDelete();
            $table->text('encrypted_payload');
            $table->unsignedSmallInteger('key_version')->default(1);
            $table->timestamp('last_rotated_at')->nullable();
            $table->timestamps();

            $table->unique('api_monitor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_monitor_secrets');
    }
};
