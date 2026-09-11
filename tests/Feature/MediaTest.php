<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaTest extends TestCase
{
    use RefreshDatabase;

    public function test_image_upload_is_scoped_and_private_until_published(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $store = Store::create(['user_id' => $user->id, 'name' => 'صور', 'slug' => 'photos']);
        $url = $this->actingAs($user)->postJson('/media', ['image' => UploadedFile::fake()->image('product.jpg', 400, 400)])
            ->assertCreated()->json('url');
        $this->get($url)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->post('/logout');
        $this->get($url)->assertNotFound();
        $store->update(['is_published' => true]);
        $this->get($url)->assertOk();
    }

    public function test_non_images_and_guest_uploads_are_rejected(): void
    {
        $this->postJson('/media', [])->assertUnauthorized();
        $user = User::factory()->create();
        Store::create(['user_id' => $user->id, 'name' => 'صور', 'slug' => 'photos']);
        $this->actingAs($user)->postJson('/media', ['image' => UploadedFile::fake()->create('script.svg', 10, 'image/svg+xml')])->assertUnprocessable();
    }

    public function test_php_upload_failures_return_json_validation_errors(): void
    {
        $user = User::factory()->create();
        Store::create(['user_id' => $user->id, 'name' => 'صور', 'slug' => 'photos']);
        $failed = new UploadedFile('', 'photo.jpg', 'image/jpeg', UPLOAD_ERR_INI_SIZE, true);
        $this->actingAs($user)->postJson('/media', ['image' => $failed])
            ->assertUnprocessable()->assertJsonValidationErrors('image');
    }
}
