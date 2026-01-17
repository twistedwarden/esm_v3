<?php
use App\Models\ScholarshipApplication;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$application = ScholarshipApplication::find(5);

if ($application) {
    echo "Application ID: 5\n";
    echo "Status: " . $application->status . "\n";
    echo "Available transitions: \n";
    if ($application->status === 'interview_completed') {
        echo "- Can be endorsed to SSC\n";
    } else {
        echo "- Cannot be endorsed to SSC (Status mismatch)\n";
    }
} else {
    echo "Application 5 not found.\n";
}
