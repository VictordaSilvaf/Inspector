<?php

namespace App\Http\Controllers;

use App\Services\Billing\PlanCatalogService;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function __construct(
        private readonly PlanCatalogService $planCatalog,
    ) {}

    public function __invoke(): Response
    {
        return Inertia::render('welcome', [
            'plans' => $this->planCatalog->catalog(),
        ]);
    }
}
