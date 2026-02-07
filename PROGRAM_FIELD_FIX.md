# Program Field Fix - Test Guide

## Issue Found
The `program` field was not being captured from CSV/Excel uploads because the `normalizeValue` function didn't return the original value when no pattern matched.

## What Was Fixed
Added a fallback return statement in the `program` field handler (line ~1461):
```javascript
// If no pattern matches, return the original value as-is
console.log(`ℹ️ Program field kept as-is: "${originalValue}"`);
return value.trim(); // Return original value for custom programs
```

## How to Test

### 1. Create a test CSV file with this content:
```csv
student_id_number,first_name,last_name,enrollment_status,academic_year,semester,year_level,enrollment_date,gender,program
2024-001,Andres,Villanueva,INACTIVE,2024-2025,SUMMER,FIRST_YEAR,28/07/2024,male,Bachelor's of science in information technology
2024-002,Juan,Vargas,INACTIVE,2024-2025,SUMMER,GRADE_12,08/06/2024,male,Bachelor of Science in Information Technology
2024-003,Carlos,Mendoza,ACTIVE,2024-2025,SECOND,GRADE_8,26/06/2024,male,Custom Program Name Here
```

### 2. Upload the CSV file in Partner School Dashboard

### 3. Check the browser console
You should see logs like:
```
ℹ️ Program field kept as-is: "Bachelor's of science in information technology"
ℹ️ Program field kept as-is: "Custom Program Name Here"
```

### 4. Verify in the database
Check that the `program` column now contains the actual values from your CSV instead of "N/A"

## Expected Results
- ✅ Program field should now be captured correctly
- ✅ Both pattern-matched programs (like "information technology" → "Bachelor of Science in Information Technology") and custom program names should work
- ✅ The PROGRAM column in the dashboard should show the actual program names instead of "N/A"

## Additional Notes
The fix ensures that:
1. If a program matches a known pattern (e.g., "information technology"), it gets normalized to the full name
2. If no pattern matches, the original value is kept as-is
3. This allows schools to use custom program names that aren't in the predefined list
