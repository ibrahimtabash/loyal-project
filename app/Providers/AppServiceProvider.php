<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Extend the deferred framework binding so it cannot overwrite the local server settings.
        $this->app->extend(\Illuminate\Foundation\Console\ServeCommand::class, fn () => new \App\Console\LocalServeCommand);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
