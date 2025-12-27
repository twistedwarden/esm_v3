# Fix for Duplicate Citizen ID Issue

## Problem

The user creation form is auto-generating citizen IDs (like `USER-001`), but these IDs already exist in the database, causing validation errors.

## Why This Happens

The auto-generation logic in the frontend calculates the next available ID based on the users it has loaded. If:

1. The user list isn't fully loaded
2. The role filter is applied
3. The database has users that aren't visible to the frontend

...the frontend might generate an ID that already exists.

## Solutions

### Solution 1: Check and Delete Test Users (Quickest)

Run this SQL to see and remove test users:

```sql
-- See all users with 'USER-' prefix
SELECT id, citizen_id, email, first_name, last_name, role, created_at
FROM users
WHERE citizen_id LIKE 'USER-%'
ORDER BY citizen_id;

-- If these are test users, delete them:
DELETE FROM users WHERE citizen_id LIKE 'USER-%';

-- Or delete specific ones:
DELETE FROM users WHERE citizen_id = 'USER-001';
```

### Solution 2: Use a Different ID Prefix

Instead of using the default auto-generated ID, modify the citizen_id generation to use a more unique prefix.

**For SSC City Council users**, you could use:

- `SSCC-001` instead of `USER-001`
- `CC-2024-001`
- `COUNCIL-001`

**To implement this**, modify the `generateNextId` function in `UserManagement.jsx`:

```javascript
// Around line 700-732
const generateNextId = (role) => {
  let prefix = "";
  switch (role) {
    case "admin":
      prefix = "ADMIN";
      break;
    case "staff":
      prefix = "STAFF";
      break;
    case "ps_rep":
      prefix = "PSREP";
      break;
    case "citizen":
      prefix = "CIT";
      break;
    case "ssc_city_council":
      prefix = "SSCC";
      break; // Changed from generic
    case "ssc_budget_dept":
      prefix = "SSCB";
      break; // Changed from generic
    case "ssc_education_affairs":
      prefix = "SSCE";
      break; // Changed from generic
    default:
      prefix = "USER";
      break;
  }

  // Rest of the function remains the same...
};
```

### Solution 3: Backend Generates Unique IDs

The most robust solution is to let the backend generate unique citizen IDs automatically. This ensures no duplicates can occur.

**Modify the auth service** to auto-generate citizen_id if not provided:

```php
// In UserController.php createUser method, after line 287:

// Auto-generate citizen_id if not provided or if it already exists
if (!isset($validated['citizen_id']) || User::where('citizen_id', $validated['citizen_id'])->exists()) {
    $validated['citizen_id'] = $this->generateUniqueCitizenId($validated['role']);
}

// Add this method to UserController:
private function generateUniqueCitizenId(string $role): string
{
    $prefix = match($role) {
        'admin' => 'ADMIN',
        'staff' => 'STAFF',
        'ps_rep' => 'PSREP',
        'citizen' => 'CIT',
        'ssc_city_council' => 'SSCC',
        'ssc_budget_dept' => 'SSCB',
        'ssc_education_affairs' => 'SSCE',
        default => 'USER'
    };

    // Find the highest number for this prefix
    $lastUser = User::where('citizen_id', 'LIKE', $prefix . '-%')
                    ->orderByRaw('CAST(SUBSTRING(citizen_id, LOCATE("-", citizen_id) + 1) AS UNSIGNED) DESC')
                    ->first();

    $nextNumber = 1;
    if ($lastUser && preg_match('/-(\d+)$/', $lastUser->citizen_id, $matches)) {
        $nextNumber = intval($matches[1]) + 1;
    }

    return sprintf('%s-%03d', $prefix, $nextNumber);
}
```

### Solution 4: Add Uniqueness Check Before Submit

Improve the frontend validation to check if the citizen_id already exists before submitting.

Add this to `UserManagement.jsx`:

```javascript
// Add before handleCreateUser (around line 240)
const checkCitizenIdExists = async (citizenId) => {
  try {
    const allUsers = [
      ...(users.citizens || []),
      ...(users.staff || []),
      ...(users.admins || []),
      ...(users.ps_reps || []),
      ...(users.ssc_city_council || []),
      ...(users.ssc_budget_dept || []),
      ...(users.ssc_education_affairs || []),
    ];

    return allUsers.some((user) => user.citizen_id === citizenId);
  } catch (error) {
    console.error("Error checking citizen ID:", error);
    return false;
  }
};

// Update validateForm function to include this check
const validateForm = async () => {
  const errors = {};

  // ... existing validations ...

  // Check if citizen_id already exists
  if (await checkCitizenIdExists(formData.citizen_id)) {
    errors.citizen_id =
      "This Citizen ID already exists. Please close and re-open the form to generate a new one.";
  }

  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};
```

## Recommended Immediate Action

**Right now:**

1. Check the UI - you should see a red error message below the "Citizen ID" field
2. The error says "The citizen id has already been taken"
3. Close the modal and re-open it to let it generate a new ID
4. Or run the SQL to delete test users

**Long term:**

- Implement Solution 3 (backend generates IDs) for the most robust solution
- Or implement Solution 2 (better prefixes) for a quick frontend fix

## Testing

After applying any solution, test by:

1. Creating users with each role
2. Verifying unique IDs are generated
3. Checking that no duplicate errors occur

---

**Status:** ✅ Error handling is working perfectly - just need to handle the duplicate ID
