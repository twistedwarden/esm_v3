<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$students = \App\Models\Student::all();
$schoolId = 14; // Foothills Christian

foreach($students as $student) {
    \DB::table('academic_records')->insert([
        'student_id' => $student->id,
        'school_id' => $schoolId,
        'educational_level' => 'TERTIARY/COLLEGE',
        'program' => 'Computer Science',
        'major' => 'Software Engineering',
        'year_level' => '2nd Year',
        'school_year' => '2024-2025',
        'school_term' => '1st Semester',
        'units_enrolled' => 18,
        'gpa' => 3.5,
        'is_current' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

echo "Created academic records for " . $students->count() . " students\n";
