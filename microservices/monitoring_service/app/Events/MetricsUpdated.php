<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MetricsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $metricType;
    public array $metrics;
    public string $timestamp;

    /**
     * Create a new event instance.
     *
     * @param string $metricType Type of metric (application, financial, ssc, interview, demographics)
     * @param array $metrics The metric data to broadcast
     */
    public function __construct(string $metricType, array $metrics)
    {
        $this->metricType = $metricType;
        $this->metrics = $metrics;
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
        return 'metrics.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'type' => $this->metricType,
            'data' => $this->metrics,
            'timestamp' => $this->timestamp,
        ];
    }
}
