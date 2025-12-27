<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StaffSeederHelper extends Seeder
{
    /**
     * Helper to find user IDs from auth service and generate staff seeder data
     */
    public function run(): void
    {
        $this->command->info('Staff Seeder Helper - Finding user IDs from auth service...');
        
        // Expected staff users (citizen_id and email)
        $expectedStaffUsers = [
            [
                'email' => 'grindshine478@gmail.com',
                'name' => 'Peter Santos',
                'citizen_id' => 'STAFF-002',
            ],
            [
                'email' => 'maria.reyes@scholarship.gov.ph',
                'name' => 'Maria Reyes',
                'citizen_id' => 'STAFF-003',
            ],
            [
                'email' => 'john.cruz@scholarship.gov.ph',
                'name' => 'John Cruz',
                'citizen_id' => 'STAFF-004',
            ],
            [
                'email' => 'ana.lopez@scholarship.gov.ph',
                'name' => 'Ana Lopez',
                'citizen_id' => 'STAFF-005',
            ],
            [
                'email' => 'carlos.mendoza@scholarship.gov.ph',
                'name' => 'Carlos Mendoza',
                'citizen_id' => 'STAFF-006',
            ],
        ];

        $foundUsers = [];
        $missingUsers = [];

        foreach ($expectedStaffUsers as $expectedUser) {
            try {
                // Try to connect to auth service database
                $authConnection = DB::connection('auth_service');
                
                // Try to find by citizen_id first, then by email
                $user = $authConnection->table('users')
                    ->where('citizen_id', $expectedUser['citizen_id'])
                    ->orWhere('email', $expectedUser['email'])
                    ->where('role', 'staff')
                    ->first();
                    
                if ($user) {
                    $foundUsers[] = [
                        'user_id' => $user->id,
                        'email' => $expectedUser['email'],
                        'name' => $expectedUser['name'],
                        'citizen_id' => $expectedUser['citizen_id'],
                    ];
                    $this->command->info("✓ Found: {$expectedUser['name']} (ID: {$user->id})");
                } else {
                    $missingUsers[] = $expectedUser;
                    $this->command->warn("✗ Missing: {$expectedUser['name']} ({$expectedUser['citizen_id']})");
                }
                
            } catch (\Exception $e) {
                $missingUsers[] = $expectedUser;
                $this->command->error("✗ Error finding {$expectedUser['name']}: " . $e->getMessage());
            }
        }

        $this->command->info("\n=== SUMMARY ===");
        $this->command->info("Found users: " . count($foundUsers));
        $this->command->info("Missing users: " . count($missingUsers));

        if (!empty($foundUsers)) {
            $this->command->info("\n=== GENERATED SEEDER DATA ===");
            $this->command->info("Copy this to your StaffSeeder.php:");
            $this->command->info("");
            
            $seederData = "        \$expectedStaffUsers = [\n";
            foreach ($foundUsers as $user) {
                $seederData .= "            [\n";
                $seederData .= "                'user_id' => {$user['user_id']},\n";
                $seederData .= "                'email' => '{$user['email']}',\n";
                $seederData .= "                'name' => '{$user['name']}',\n";
                $seederData .= "                'citizen_id' => '{$user['citizen_id']}',\n";
                $seederData .= "            ],\n";
            }
            $seederData .= "        ];";
            
            $this->command->info($seederData);
        }

        if (!empty($missingUsers)) {
            $this->command->info("\n=== MISSING USERS ===");
            $this->command->info("These users need to be created in auth service first:");
            foreach ($missingUsers as $user) {
                $this->command->info("- {$user['name']} ({$user['citizen_id']}) - {$user['email']}");
            }
            $this->command->info("\nRun: php artisan db:seed --class=StaffUserSeeder");
        }
    }
}
