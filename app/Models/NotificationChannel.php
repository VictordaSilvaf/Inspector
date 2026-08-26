<?php

namespace App\Models;

use App\Enums\NotificationChannelType;
use App\Enums\NotificationChannelVerificationStatus;
use Database\Factories\NotificationChannelFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property NotificationChannelType $type
 * @property string $value
 * @property NotificationChannelVerificationStatus $verification_status
 * @property Carbon|null $verified_at
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'type',
    'value',
    'verification_status',
    'verified_at',
    'is_active',
])]
class NotificationChannel extends Model
{
    /** @use HasFactory<NotificationChannelFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'verification_status' => 'pending',
        'is_active' => true,
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<NotificationChannelVerification, $this>
     */
    public function verifications(): HasMany
    {
        return $this->hasMany(NotificationChannelVerification::class);
    }

    /**
     * @return HasMany<AlertSubscription, $this>
     */
    public function alertSubscriptions(): HasMany
    {
        return $this->hasMany(AlertSubscription::class);
    }

    public function isVerified(): bool
    {
        return $this->verification_status === NotificationChannelVerificationStatus::Verified
            && $this->is_active;
    }

    /**
     * @return array<string, mixed>
     */
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'value' => $this->value,
            'verificationStatus' => $this->verification_status->value,
            'verifiedAt' => $this->verified_at?->toIso8601String(),
            'isActive' => $this->is_active,
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => NotificationChannelType::class,
            'verification_status' => NotificationChannelVerificationStatus::class,
            'verified_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }
}
