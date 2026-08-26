<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_monitor_headers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_monitor_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('value_encrypted')->nullable();
            $table->text('value_plain')->nullable();
            $table->boolean('is_sensitive')->default(true);
            $table->timestamps();

            $table->unique(['api_monitor_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_monitor_headers');
    }
};
