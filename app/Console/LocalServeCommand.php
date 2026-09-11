<?php

namespace App\Console;

use Illuminate\Foundation\Console\ServeCommand;

class LocalServeCommand extends ServeCommand
{
    protected function serverCommand()
    {
        $temporaryDirectory = storage_path('app/private/upload-tmp');
        if (!is_dir($temporaryDirectory) && !mkdir($temporaryDirectory, 0700, true) && !is_dir($temporaryDirectory)) {
            throw new \RuntimeException('Unable to create the local upload temporary directory.');
        }
        if (!is_writable($temporaryDirectory)) {
            throw new \RuntimeException('The local upload temporary directory is not writable.');
        }

        $command = parent::serverCommand();
        // PHP parses multipart bodies before Laravel boots. These settings must reach the child process.
        array_splice($command, 1, 0, [
            '-d', 'upload_tmp_dir='.$temporaryDirectory,
            '-d', 'upload_max_filesize=4M',
            '-d', 'post_max_size=8M',
            '-d', 'display_errors=stderr',
            '-d', 'display_startup_errors=0',
            '-d', 'log_errors=1',
            '-d', 'error_log='.storage_path('logs/php-server.log'),
        ]);

        return $command;
    }
}
