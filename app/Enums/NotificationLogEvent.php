<?php

namespace App\Enums;

enum NotificationLogEvent: string
{
    case Triggered = 'triggered';
    case Recovered = 'recovered';
}
