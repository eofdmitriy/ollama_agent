<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CleanupOldUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:cleanup-old-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = User::onlyTrashed()
        ->where('deleted_at', '<=', now()->subDays(90))
        ->get()
        ->each(function ($user) {
            // Это запустит цепочку forceDeleting в User -> Chat -> Message
            $user->forceDelete();
        })
        ->count();

    }
}
