<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('hajirin:expire-pending-orders')
    ->everyMinute()
    ->withoutOverlapping(10);

Schedule::command('hajirin:sync-event-statuses')
    ->everyFiveMinutes()
    ->withoutOverlapping(10);

Schedule::command('hajirin:purge-eo-documents')
    ->daily()
    ->withoutOverlapping(30);
