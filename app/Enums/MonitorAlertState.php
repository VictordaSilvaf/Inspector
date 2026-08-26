<?php

namespace App\Enums;

enum MonitorAlertState: string
{
    case Ok = 'ok';
    case Firing = 'firing';
}
