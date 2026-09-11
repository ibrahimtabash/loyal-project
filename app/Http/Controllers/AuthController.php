<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function login()
    {
        return Inertia::render('Auth', ['mode' => 'login']);
    }

    public function register()
    {
        return Inertia::render('Auth', ['mode' => 'register']);
    }

    public function authenticate(Request $request)
    {
        $credentials = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages(['email' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة.']);
        }
        $request->session()->regenerate();

        return redirect()->intended('/dashboard');
    }

    public function create(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100', 'store_name' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::min(12)->letters()->numbers()],
        ]);
        $user = DB::transaction(function () use ($data) {
            $user = User::create(collect($data)->only('name', 'email', 'password')->all());
            Store::create(['user_id' => $user->id, 'name' => $data['store_name'], 'slug' => 'store-'.Str::lower(Str::random(10))]);

            return $user;
        });
        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/store');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
