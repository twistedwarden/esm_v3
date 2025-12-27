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
            // StaffUserSeeder::class,
            // CreateCitizenUser::class,
            PartnerSchoolSeeder::class,
            SscMembersSeeder::class,
            AdminUsersSeeder::class,
            // CitizenUsersSeeder::class,
            PartnerSchoolRepsSeeder::class,
        ]);
    }
}