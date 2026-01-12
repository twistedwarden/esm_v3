<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AnalyticsDailyEnrollment;
use App\Models\AnalyticsStudentPerformance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Daily Enrollment (Past 30 Days)
        $programs = ['BS CS', 'BS IT', 'BS IS', 'BS EMC'];
        $years = ['1st', '2nd', '3rd', '4th'];

        $startDate = Carbon::now()->subDays(30);

        for ($i = 0; $i <= 30; $i++) {
            $date = $startDate->copy()->addDays($i);

            foreach ($programs as $program) {
                foreach ($years as $year) {
                    // Slight random fluctuation to make charts look real
                    $baseCount = rand(50, 100); 
                    
                    AnalyticsDailyEnrollment::create([
                        'snapshot_date' => $date,
                        'program' => $program,
                        'year_level' => $year,
                        'total_students' => $baseCount,
                        'active_students' => (int)($baseCount * 0.95), // 95% active
                        'dropped_students' => (int)($baseCount * 0.02),
                        'graduated_students' => 0,
                    ]);
                }
            }
        }

        // 2. Seed Student Performance (For 500 Students)
        // This simulates the data we would sync from Scholarship Service
        for ($studentId = 1001; $studentId <= 1500; $studentId++) {
            $gpa = $this->randomFloat(1.5, 4.0);
            $attendance = $this->randomFloat(70, 100);
            
            // Determine Risk Level based on simple logic
            $risk = 'low';
            if ($gpa < 2.5 || $attendance < 80) $risk = 'medium';
            if ($gpa < 2.0 || $attendance < 75) $risk = 'high';

            AnalyticsStudentPerformance::create([
                'student_id' => $studentId,
                'academic_term' => '2025-1',
                'gpa' => $gpa,
                'attendance_rate' => $attendance,
                'failed_subjects_count' => ($gpa < 2.0) ? rand(1, 3) : 0,
                'risk_level' => $risk
            ]);
        }
    }

    private function randomFloat($min, $max)
    {
        return $min + mt_rand() / mt_getrandmax() * ($max - $min);
    }
}
