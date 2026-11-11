<?php

namespace Tests\Feature;

use App\Models\Event;
use Database\Seeders\CategorySeeder;
use Database\Seeders\EventSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EventDetailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CategorySeeder::class);
        $this->seed(EventSeeder::class);
    }

    public function test_event_detail_page_can_be_rendered(): void
    {
        $response = $this->get('/event/indonesia-tech-conference-2026');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Event/Detail')
            ->has('eventData')
            ->has('eventData.title')
            ->has('eventData.tickets')
            ->has('relatedEvents')
            ->where('eventSlug', 'indonesia-tech-conference-2026')
        );
    }

    public function test_non_existent_event_returns_404(): void
    {
        $response = $this->get('/event/event-tidak-ada-123456');

        $response->assertStatus(404);
    }

    public function test_unpublished_event_returns_404(): void
    {
        Event::where('slug', 'indonesia-tech-conference-2026')
            ->update(['status' => 'DRAFT']);

        $response = $this->get('/event/indonesia-tech-conference-2026');

        $response->assertStatus(404);
    }
}
