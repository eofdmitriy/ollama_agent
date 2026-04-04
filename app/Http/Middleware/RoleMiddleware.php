<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // Проверяем: авторизован ли юзер и совпадает ли его роль
        if (!$request->user() || $request->user()->role !== $role) {
            abort(403, 'Доступ запрещен: требуется роль ' . $role);
        }

        return $next($request);
    }
}
