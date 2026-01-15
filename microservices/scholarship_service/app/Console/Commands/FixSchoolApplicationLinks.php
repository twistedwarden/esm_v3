<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\School;
use App\Models\PartnerSchoolApplication;

class FixSchoolApplicationLinks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'partner-schools:fix-links';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix school-application relationship by updating application_id in schools table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing school-application links...');

        // Find all schools that have applications but no application_id set
        $schools = School::whereHas('scholarshipApplications', function($query) {
            // This won't work, need to join with partner_school_applications
        })->get();

        // Better approach: Get all applications and update their schools
        $applications = PartnerSchoolApplication::with('school')->get();
        
        $fixed = 0;
        foreach ($applications as $application) {
            if ($application->school && $application->school->application_id !== $application->id) {
                $application->school->application_id = $application->id;
                $application->school->save();
                $fixed++;
                $this->line("Fixed school ID {$application->school->id} - linked to application {$application->id}");
            }
        }

        $this->info("✅ Fixed {$fixed} school-application links");
        
        return Command::SUCCESS;
    }
}
