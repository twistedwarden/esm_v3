<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AuditLog;
use Carbon\Carbon;

class AuditLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT'];
        $userRoles = ['admin', 'staff', 'citizen', 'ps_rep'];
        $resourceTypes = ['User', 'Application', 'Document', 'Student', 'Staff'];
        $statuses = ['success', 'failed', 'error'];
        
        $users = [
            ['id' => 1, 'email' => 'admin@caloocan.gov.ph', 'role' => 'admin'],
            ['id' => 2, 'email' => 'staff@caloocan.gov.ph', 'role' => 'staff'],
            ['id' => 3, 'email' => 'citizen@example.com', 'role' => 'citizen'],
            ['id' => 4, 'email' => 'school.rep@university.edu.ph', 'role' => 'ps_rep'],
        ];

        $descriptions = [
            'Created new user account',
            'Updated user profile information',
            'Deactivated user account',
            'User logged into the system',
            'User logged out of the system',
            'Viewed user management dashboard',
            'Exported user data to CSV',
            'Imported student records',
            'Updated scholarship application',
            'Approved scholarship application',
            'Rejected scholarship application',
            'Viewed application details',
            'Downloaded application documents',
            'Updated system settings',
            'Performed bulk operation on records',
        ];

        // Create audit logs for the last 30 days
        for ($i = 0; $i < 200; $i++) {
            $user = $users[array_rand($users)];
            $action = $actions[array_rand($actions)];
            $resourceType = $resourceTypes[array_rand($resourceTypes)];
            $status = $statuses[array_rand($statuses)];
            $description = $descriptions[array_rand($descriptions)];
            
            // Create date within last 30 days
            $createdAt = Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59));
            
            AuditLog::create([
                'user_id' => $user['id'],
                'user_email' => $user['email'],
                'user_role' => $user['role'],
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => rand(1, 100),
                'description' => $description,
                'old_values' => $action === 'UPDATE' ? ['field' => 'old_value'] : null,
                'new_values' => in_array($action, ['CREATE', 'UPDATE']) ? ['field' => 'new_value'] : null,
                'ip_address' => '192.168.1.' . rand(1, 254),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'session_id' => 'session_' . rand(1000, 9999),
                'status' => $status,
                'error_message' => $status === 'error' ? 'An error occurred during the operation' : null,
                'metadata' => [
                    'browser' => 'Chrome',
                    'os' => 'Windows 10',
                    'device' => 'Desktop',
                    'location' => 'Caloocan City, Philippines'
                ],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        // Create some recent high-priority logs
        $recentLogs = [
            [
                'user_id' => 1,
                'user_email' => 'admin@caloocan.gov.ph',
                'user_role' => 'admin',
                'action' => 'CREATE',
                'resource_type' => 'User',
                'resource_id' => 5,
                'description' => 'Created new staff member: jane.smith@caloocan.gov.ph',
                'new_values' => ['email' => 'jane.smith@caloocan.gov.ph', 'role' => 'staff'],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'session_id' => 'session_admin_001',
                'status' => 'success',
                'metadata' => ['created_via' => 'admin_panel'],
                'created_at' => Carbon::now()->subHours(2),
            ],
            [
                'user_id' => 1,
                'user_email' => 'admin@caloocan.gov.ph',
                'user_role' => 'admin',
                'action' => 'UPDATE',
                'resource_type' => 'User',
                'resource_id' => 3,
                'description' => 'Updated citizen user profile: citizen@example.com',
                'old_values' => ['mobile' => null],
                'new_values' => ['mobile' => '+63-912-345-6789'],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'session_id' => 'session_admin_001',
                'status' => 'success',
                'metadata' => ['updated_via' => 'admin_panel'],
                'created_at' => Carbon::now()->subHours(1),
            ],
            [
                'user_id' => 2,
                'user_email' => 'staff@caloocan.gov.ph',
                'user_role' => 'staff',
                'action' => 'LOGIN',
                'resource_type' => 'User',
                'resource_id' => 2,
                'description' => 'Staff member logged in: staff@caloocan.gov.ph',
                'ip_address' => '192.168.1.101',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'session_id' => 'session_staff_001',
                'status' => 'success',
                'metadata' => ['login_method' => 'web'],
                'created_at' => Carbon::now()->subMinutes(30),
            ],
            [
                'user_id' => 1,
                'user_email' => 'admin@caloocan.gov.ph',
                'user_role' => 'admin',
                'action' => 'EXPORT',
                'resource_type' => 'User',
                'description' => 'Exported user management data',
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'session_id' => 'session_admin_001',
                'status' => 'success',
                'metadata' => ['export_type' => 'csv', 'record_count' => 12],
                'created_at' => Carbon::now()->subMinutes(15),
            ],
        ];

        foreach ($recentLogs as $logData) {
            AuditLog::create($logData);
        }
    }
}
