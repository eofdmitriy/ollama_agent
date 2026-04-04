<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use App\Contracts\LlmServiceContract; 
use App\Services\RealOllamaService;  
use App\Services\MockOllamaService;  
use App\Models\User;           
use App\Observers\UserObserver; 

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LlmServiceContract::class, function ($app) {
            
            // 1. Смотрим в конфиг, какой драйвер выбран
            $driver = config('services.llm.driver');

            // 2. Выбираем нужный класс
            return match ($driver) {
                'mock' => new MockOllamaService(),
                'ollama' => new RealOllamaService(),
                default => throw new \Exception("Драйвер [$driver] не поддерживается"),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        User::observe(UserObserver::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
