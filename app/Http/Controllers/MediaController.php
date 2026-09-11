<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function upload(Request $request)
    {
        $store = Store::where('user_id', $request->user()->id)->firstOrFail();
        $request->validate(['image' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096|dimensions:max_width=4096,max_height=4096']);
        $file = $request->file('image');
        $name = Str::uuid().'.'.$file->extension();
        $path = $file->storeAs('store-media/'.$store->id, $name, 'local');
        abort_unless($path, 500);

        return response()->json(['url' => '/media/'.$store->id.'/'.$name], 201);
    }

    public function show(Request $request, int $storeId, string $filename)
    {
        $store = Store::findOrFail($storeId);
        abort_unless($store->is_published || $request->user()?->id === $store->user_id, 404);
        $path = 'store-media/'.$storeId.'/'.$filename;
        abort_unless(Storage::disk('local')->exists($path), 404);

        return response()->file(Storage::disk('local')->path($path), ['X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, max-age=3600']);
    }
}
