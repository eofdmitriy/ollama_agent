<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest; 
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Contracts\LlmServiceContract;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class UserSettingsController extends Controller
{
    public function __construct(
        protected LlmServiceContract $ollama
    ) {}

    public function show(Request $request)
    {
         return Inertia::render('profile/Show', [
            'allChats' => fn () => Auth::user()->chats()
                ->latest()
                ->take(15)
                ->get(['id', 'title']),
            'ollamaStatus' => Inertia::lazy(fn () => $this->ollama->checkStatus()),
        ]);
    }

    public function updateInfo(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return back(); 
    }

    public function changePassword(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
        ]);

        return back();
    }

    public function destroyAvatar(Request $request)
    {
        $user = $request->user();
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }
        return back();
    }

    public function updateAvatar(Request $request)
    {

        $rules = [
            'avatar' => 'nullable|image|max:2048|mimes:jpg,jpeg,png,webp',
        ];

        $messages = [
            'avatar.image' => 'Файл должен быть изображением',
            'avatar.max' => 'Размер фото не должен превышать 2 МБ',
            'avatar.mimes' => 'Допустимые форматы: JPG, PNG, WEBP',
        ];

        $request->validate($rules, $messages);

        $user = $request->user();
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return back();
    }

    public function deleteAccount(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();
        Auth::logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
