<?php

namespace App\Enums;

enum NotificationChannelVerificationStatus: string
{
    case Pending = 'pending';
    case Verified = 'verified';
    case Inactive = 'inactive';
}
