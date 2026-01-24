<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CitizenUsersSeeder::class, // Must run before scholarship service seeders
            StaffUserSeeder::class,
                // CreateCitizenUser::class,
            PartnerSchoolSeeder::class,
            SscMembersSeeder::class,
            AdminUsersSeeder::class,
            PartnerSchoolRepsSeeder::class,
        ]);
    }
}