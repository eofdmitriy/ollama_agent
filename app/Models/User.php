<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

     /**
     * Получить все чаты пользователя
     */
    
    public function chats(): HasMany
    {
        return $this->hasMany(Chat::class);
    }

    protected static function booted()
    {
        static::deleting(function ($user) {
            // Мы проверяем, что это не физическое удаление (forceDelete)
            if (!$user->isForceDeleting()) {
                // Запускаем удаление каждого чата как объекта
                $user->chats()->get()->each->delete();
            }
        });
        
        static::restoring(function ($user) {
            $deletedAt = $user->deleted_at;

            // 1. Находим чаты, удаленные вместе с юзером (в окне 5 секунд)
            $chatsToRestore = $user->chats()->withTrashed()
                ->whereBetween('deleted_at', [
                    $deletedAt->copy()->subSeconds(5), 
                    $deletedAt->copy()->addSeconds(5)
                ])
                ->get();

            // 2. Важно: вызываем restore() у каждой МОДЕЛИ чата в цикле
            // Это заставит сработать метод static::restoring внутри модели Chat
            $chatsToRestore->each(function ($chat) {
                $chat->restore();
            });
        });

        static::forceDeleting(function ($user) {
            // 1. Физическое удаление аватара с проверкой
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            // 2. Каскадное жесткое удаление чатов
            // Используем withTrashed(), чтобы зацепить даже те, что уже в "корзине"
            $user->chats()->withTrashed()->get()->each(function ($chat) {
                $chat->forceDelete();
            });
        });
    }


}
