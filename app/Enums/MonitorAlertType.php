<?php

namespace App\Enums;

enum MonitorAlertType: string
{
    case Availability = 'availability';
    case StatusCode = 'status_code';
    case ResponseTime = 'response_time';
}
