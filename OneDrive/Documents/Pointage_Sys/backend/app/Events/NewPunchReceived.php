<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewPunchReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly \App\Models\Employee $employee,
        public readonly \App\Models\AttendanceLog $log,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('attendance')];
    }

    public function broadcastAs(): string
    {
        return 'punch.received';
    }

    public function broadcastWith(): array
    {
        return [
            'employee_id' => $this->employee->id,
            'full_name'   => $this->employee->full_name,
            'department'  => $this->employee->department,
            'punched_at'  => $this->log->punched_at->toIso8601String(),
        ];
    }
}
