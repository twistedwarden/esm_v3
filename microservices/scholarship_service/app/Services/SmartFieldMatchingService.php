<?php

namespace App\Services;

class SmartFieldMatchingService
{
    /**
     * Map of standard field names to their potential variations and synonyms
     */
    protected $fieldDefinitions = [
        'student_id_number' => [
            'variations' => ['student_id', 'id_number', 'student_no', 'id_no', 'stud_id', 'student_code', 'lrn', 'learner_reference_number', 'studentid', 'studentnumber', 'usn', 'id'],
            'weight' => 1.5
        ],
        'first_name' => [
            'variations' => ['given_name', 'fname', 'first', 'given', 'givenname', 'firstname', 'ngalan'],
            'weight' => 1.2
        ],
        'last_name' => [
            'variations' => ['surname', 'family_name', 'lname', 'last', 'family', 'familyname', 'lastname', 'apelyido'],
            'weight' => 1.2
        ],
        'middle_name' => [
            'variations' => ['mname', 'middle', 'mid_name', 'middle_initial', 'mi', 'middlename', 'middleinitial'],
            'weight' => 1.0
        ],
        'extension_name' => [
            'variations' => ['suffix', 'ext', 'name_extension', 'qualifier', 'generation', 'namesuffix'],
            'weight' => 0.8
        ],
        'email_address' => [
            'variations' => ['email', 'e_mail', 'mail_address', 'contact_email', 'google_account', 'yahoo_mail', 'emailaddress', 'mailaddress'],
            'weight' => 1.4
        ],
        'contact_number' => [
            'variations' => ['mobile', 'phone', 'cellphone', 'tel_no', 'cp_no', 'contact_no', 'telephone', 'mobile_no', 'phonenumber', 'mobilenumber', 'contactnumber', 'cp_number', 'contact'],
            'weight' => 1.3
        ],
        'sex' => [ // Maps to 'sex' in DB, but matches 'gender' in CSV
            'variations' => ['gender', 'sex_at_birth', 'biological_sex', 'sex', 'kasarian'],
            'weight' => 1.5 // Increased weight for gender/sex
        ],
        'birth_date' => [
            'variations' => ['dob', 'date_of_birth', 'birthday', 'birthdate', 'born_on', 'dateofbirth', 'birth_day'],
            'weight' => 1.3
        ],
        'birth_place' => [
            'variations' => ['place_of_birth', 'pob', 'born_at', 'birthplace', 'placeofbirth', 'birth_location'],
            'weight' => 1.0
        ],
        'address' => [
            'variations' => ['residence', 'current_address', 'permanent_address', 'location', 'home_address', 'homeaddress', 'currentaddress', 'address_line_1', 'full_address'],
            'weight' => 1.0
        ],
        'program' => [
            'variations' => ['course', 'degree', 'major', 'strand', 'specialization', 'course_enrolled', 'degreeprogram', 'program_of_study', 'academic_program', 'kurso'],
            'weight' => 1.5 // Increased weight
        ],
        'year_level' => [
            'variations' => ['year', 'grade', 'level', 'yr_level', 'grade_level', 'academic_level', 'yearlevel', 'gradelevel', 'classification'],
            'weight' => 1.2
        ],
        'enrollment_status' => [
            'variations' => ['status', 'is_enrolled', 'registration_status', 'academic_status', 'enrollmentstatus', 'student_status'],
            'weight' => 1.1
        ],
        'enrollment_term' => [
            'variations' => ['term', 'semester', 'sem', 'school_term', 'academic_term', 'enrollmentterm', 'period'],
            'weight' => 1.1
        ],
        'school_year' => [
            'variations' => ['academic_year', 'sy', 'ay', 'year', 'academicyear', 'schoolyear', 'fiscal_year'],
            'weight' => 1.1
        ],
    ];

    /**
     * Match headers to standard fields using fuzzy logic and AI-like scoring
     */
    public function matchHeaders(array $headers): array
    {
        $mapping = [];
        $usedFields = [];

        foreach ($headers as $header) {
            $bestMatch = null;
            $highestScore = 0;

            $normalizedHeader = $this->normalizeString($header);

            foreach ($this->fieldDefinitions as $field => $definition) {
                // Calculate score based on exact match, synonym match, and Levenshtein distance
                $score = $this->calculateMatchScore($normalizedHeader, $field, $definition);

                // Lowered threshold slightly to be more inclusive
                if ($score > $highestScore && $score > 0.55) {
                    $highestScore = $score;
                    $bestMatch = $field;
                }
            }

            if ($bestMatch) {
                // If this field is already used, check if the current match is better
                if (isset($usedFields[$bestMatch])) {
                    if ($highestScore > $usedFields[$bestMatch]['score']) {
                        // Unmap the previous one
                        unset($mapping[$usedFields[$bestMatch]['header']]);
                        // Map the new one
                        $mapping[$header] = $bestMatch;
                        $usedFields[$bestMatch] = ['header' => $header, 'score' => $highestScore];
                    }
                } else {
                    $mapping[$header] = $bestMatch;
                    $usedFields[$bestMatch] = ['header' => $header, 'score' => $highestScore];
                }
            }
        }

        return $mapping;
    }

    /**
     * Calculate a match score (0.0 to 1.0+)
     */
    protected function calculateMatchScore(string $input, string $target, array $definition): float
    {
        $input = strtolower($input);
        $target = strtolower($target);

        // Exact match
        if ($input === $target) {
            return 1.0 * $definition['weight'];
        }

        // Check synonyms
        foreach ($definition['variations'] as $variation) {
            if ($input === $variation) {
                return 0.95 * $definition['weight'];
            }
            // Partial synonym match (input contains variation)
            if (strpos($input, $variation) !== false) {
                return 0.85 * $definition['weight'];
            }
            // Reverse Partial match (variation contains input - usually less reliable but useful)
            if (strpos($variation, $input) !== false && strlen($input) > 3) {
                return 0.75 * $definition['weight'];
            }
        }

        // Levenshtein / Similarity
        // Calculate similarity with the target field name
        $simTarget = $this->calculateSimilarity($input, $target);

        // Calculate max similarity with any variation
        $maxSimVariation = 0;
        foreach ($definition['variations'] as $variation) {
            $sim = $this->calculateSimilarity($input, $variation);
            if ($sim > $maxSimVariation) {
                $maxSimVariation = $sim;
            }
        }

        $baseScore = max($simTarget, $maxSimVariation);

        return $baseScore * $definition['weight'];
    }

    /**
     * Calculate similarity between two strings (0.0 to 1.0)
     */
    protected function calculateSimilarity(string $s1, string $s2): float
    {
        $len1 = strlen($s1);
        $len2 = strlen($s2);

        if ($len1 === 0 || $len2 === 0) {
            return 0.0;
        }

        $lev = levenshtein($s1, $s2);
        $maxLength = max($len1, $len2);

        return 1.0 - ($lev / $maxLength);
    }

    /**
     * Normalize string for comparison
     */
    protected function normalizeString(string $input): string
    {
        $input = strtolower($input);
        $input = str_replace(['_', '-', ' '], '', $input); // Remove delimiters
        return $input;
    }
}
