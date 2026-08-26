<?php

namespace App\Enums;

enum NotificationChannelType: string
{
    case Email = 'email';
    case Whatsapp = 'whatsapp';
    case Telegram = 'telegram';
}
