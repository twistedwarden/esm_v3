<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Staff users that should exist in auth service
        // Based on the current database state, we'll work with existing user IDs
        $expectedStaffUsers = [
            [
                'user_id' => 2,
                'email' => 'staff@caloocan.gov.ph',
                'name' => 'John Doe',
                'citizen_id' => 'STAFF-001',
            ],
            [
                'user_id' => 6,
                'email' => 'mike.johnson@caloocan.gov.ph',
                'name' => 'Mike Johnson',
                'citizen_id' => 'STAFF-003',
            ],
            [
                'user_id' => 8,
                'email' => 'grindshine478@gmail.com',
                'name' => 'Peter Santos',
                'citizen_id' => 'STAFF-002',
            ],
            // Add more staff users as they are created in auth service
            // You can uncomment these once the users exist in auth service
            // [
            //     'user_id' => 10,
            //     'email' => 'john.cruz@scholarship.gov.ph',
            //     'name' => 'John Cruz',
            //     'citizen_id' => 'STAFF-004',
            // ],
            // [
            //     'user_id' => 11,
            //     'email' => 'ana.lopez@scholarship.gov.ph',
            //     'name' => 'Ana Lopez',
            //     'citizen_id' => 'STAFF-005',
            // ],
            // [
            //     'user_id' => 12,
            //     'email' => 'carlos.mendoza@scholarship.gov.ph',
            //     'name' => 'Carlos Mendoza',
            //     'citizen_id' => 'STAFF-006',
            // ],
        ];

        // Create or update staff records
        foreach ($expectedStaffUsers as $expectedUser) {
            $existingStaff = DB::table('staff')->where('user_id', $expectedUser['user_id'])->first();
            
            if (!$existingStaff) {
                DB::table('staff')->insert([
                    'user_id' => $expectedUser['user_id'],
                    'citizen_id' => $expectedUser['citizen_id'],
                    'system_role' => 'interviewer',
                    'department' => 'Scholarship Management',
                    'position' => 'Interview Coordinator',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                $this->command->info("Created staff record for {$expectedUser['name']} (User ID: {$expectedUser['user_id']})");
            } else {
                // Update existing record to ensure it matches
                DB::table('staff')
                    ->where('user_id', $expectedUser['user_id'])
                    ->update([
                        'citizen_id' => $expectedUser['citizen_id'],
                        'system_role' => 'interviewer',
                        'department' => 'Scholarship Management',
                        'position' => 'Interview Coordinator',
                        'is_active' => true,
                        'updated_at' => now(),
                    ]);
                
                $this->command->info("Updated staff record for {$expectedUser['name']} (User ID: {$expectedUser['user_id']})");
            }
        }

        $this->command->info('Staff seeding completed. To add more staff members:');
        $this->command->info('1. First create the user in auth service using StaffUserSeeder');
        $this->command->info('2. Note the user ID from the auth service');
        $this->command->info('3. Add the user to this seeder with the correct user_id');
        $this->command->info('4. Run this seeder again');
    }
}
