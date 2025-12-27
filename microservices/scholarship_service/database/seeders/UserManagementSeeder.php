<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Staff;

class UserManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create staff records for the staff users created in auth service
        $staffUsers = [
            [
                'user_id' => 2, // STAFF-001 from auth service
                'citizen_id' => 'STAFF-001',
                'system_role' => 'administrator',
                'department' => 'IT Department',
                'position' => 'Senior Administrator',
                'is_active' => true,
            ],
            [
                'user_id' => 5, // STAFF-002 from auth service
                'citizen_id' => 'STAFF-002',
                'system_role' => 'interviewer',
                'department' => 'Scholarship Department',
                'position' => 'Interviewer',
                'is_active' => true,
            ],
            [
                'user_id' => 6, // STAFF-003 from auth service
                'citizen_id' => 'STAFF-003',
                'system_role' => 'reviewer',
                'department' => 'Scholarship Department',
                'position' => 'Application Reviewer',
                'is_active' => true,
            ],
        ];

        foreach ($staffUsers as $staffData) {
            Staff::updateOrCreate(
                ['user_id' => $staffData['user_id']],
                $staffData
            );
        }
    }
}
