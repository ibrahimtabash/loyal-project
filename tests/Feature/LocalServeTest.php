<?php

namespace Tests\Feature;

use App\Console\LocalServeCommand;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class LocalServeTest extends TestCase
{
    public function test_artisan_uses_project_upload_settings_in_the_php_child_process(): void
    {
        $command = Artisan::all()['serve'];
        $this->assertInstanceOf(LocalServeCommand::class, $command);
        $probe = new class extends LocalServeCommand {
            protected function host() { return '127.0.0.1'; }
            protected function port() { return 8000; }
            public function arguments(): array { return $this->serverCommand(); }
        };
        $probe->setLaravel($this->app);
        $arguments = $probe->arguments();
        $this->assertContains('upload_tmp_dir='.storage_path('app/private/upload-tmp'), $arguments);
        $this->assertContains('display_errors=stderr', $arguments);
        $this->assertContains('upload_max_filesize=4M', $arguments);
        $this->assertTrue(is_writable(storage_path('app/private/upload-tmp')));
    }
}
