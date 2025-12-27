<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StaffSeederWithRealIds extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Actual user IDs from auth service (after seeding)
        $staffUsers = [
            [
                'user_id' => 9, // Peter Santos
                'citizen_id' => 'STAFF-002',
                'name' => 'Peter Santos',
                'email' => 'peter.santos@scholarship.gov.ph',
            ],
            [
                'user_id' => 10, // Maria Reyes
                'citizen_id' => 'STAFF-003',
                'name' => 'Maria Reyes',
                'email' => 'maria.reyes@scholarship.gov.ph',
            ],
            [
                'user_id' => 11, // John Cruz
                'citizen_id' => 'STAFF-004',
                'name' => 'John Cruz',
                'email' => 'john.cruz@scholarship.gov.ph',
            ],
            [
                'user_id' => 12, // Ana Lopez
                'citizen_id' => 'STAFF-005',
                'name' => 'Ana Lopez',
                'email' => 'ana.lopez@scholarship.gov.ph',
            ],
            [
                'user_id' => 13, // Carlos Mendoza
                'citizen_id' => 'STAFF-006',
                'name' => 'Carlos Mendoza',
                'email' => 'carlos.mendoza@scholarship.gov.ph',
            ],
        ];

        foreach ($staffUsers as $user) {
            // Check if staff record already exists for this user_id
            $existingStaff = DB::table('staff')->where('user_id', $user['user_id'])->first();
            
            if (!$existingStaff) {
                DB::table('staff')->insert([
                    'user_id' => $user['user_id'],
                    'citizen_id' => $user['citizen_id'],
                    'system_role' => 'interviewer',
                    'department' => 'Scholarship Management',
                    'position' => 'Interview Coordinator',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                $this->command->info("Created staff record for {$user['name']} (User ID: {$user['user_id']})");
            } else {
                $this->command->info("Staff record already exists for {$user['name']} (User ID: {$user['user_id']})");
            }
        }

        $this->command->info('Staff users seeding with real IDs completed.');
    }
}
