<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlertCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $alertType;
    public string $severity;
    public string $title;
    public string $message;
    public array $context;
    public string $timestamp;

    /**
     * Create a new event instance.
     *
     * @param string $alertType Type of alert
     * @param string $severity Alert severity (low, medium, high, critical)
     * @param string $title Alert title
     * @param string $message Alert message
     * @param array $context Additional context data
     */
    public function __construct(
        string $alertType,
        string $severity,
        string $title,
        string $message,
        array $context = []
    ) {
        $this->alertType = $alertType;
        $this->severity = $severity;
        $this->title = $title;
        $this->message = $message;
        $this->context = $context;
        $this->timestamp = now()->toIso8601String();
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return Channel
     */
    public function broadcastOn(): Channel
    {
        return new Channel('analytics');
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'alert.created';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'alert_type' => $this->alertType,
            'severity' => $this->severity,
            'title' => $this->title,
            'message' => $this->message,
            'context' => $this->context,
            'timestamp' => $this->timestamp,
        ];
    }
}
