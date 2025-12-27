# React Error #300 Fix - "Rendered Fewer Hooks Than Expected"

## Problem Summary

**Error:** Minified React error #300  
**When:** Occurs after logging in, but resolves after page refresh  
**Root Cause:** Hook ordering violation in `GatewayLogin.tsx`

## What is React Error #300?

React error #300 means **"Rendered fewer hooks than expected"**. This occurs when:

- Hooks are called conditionally
- Early returns happen before all hooks are executed
- The number of hook calls changes between renders

React requires that **all hooks must be called in the same order on every render**.

## The Issue in `GatewayLogin.tsx`

### Before Fix:

```tsx
export const GatewayLogin: React.FC = () => {
  // Lines 24-96: All useState declarations (20+ hooks)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // ... many more useState hooks ...

  // Lines 98-120: First few useEffect hooks
  useEffect(() => {
    /* ... */
  }, []);
  useEffect(() => {
    /* ... */
  }, []);
  useEffect(() => {
    // Navigation effect
    if (!isLoading && currentUser) {
      navigate("/admin" | "/portal" | "/partner-school");
    }
  }, [currentUser, isLoading, navigate]);

  // Line 123: EARLY RETURN ⚠️
  if (isLoading || currentUser) {
    return <LoadingSkeleton />;
  }

  // ... lots of component logic ...

  // Line 711: HOOK AFTER EARLY RETURN ❌ THIS CAUSES ERROR #300
  useEffect(() => {
    if (error && error.toLowerCase().includes("password")) {
      displayToast(error, "error");
      clearError();
    }
  }, [error, clearError]);

  return <MainComponent />;
};
```

### The Problem Flow:

1. **User logs in** → `currentUser` is set in auth store
2. **Component re-renders multiple times** during navigation transition
3. **Sometimes:** Component executes all hooks (lines 24-711) then returns
4. **Sometimes:** Component hits early return at line 123, skipping the hook at line 711
5. **React detects inconsistent hook count** → throws Error #300
6. **After refresh:** State stabilizes, hooks are called consistently

## The Fix

**Moved the `useEffect` from after the early return to before it:**

### After Fix:

```tsx
export const GatewayLogin: React.FC = () => {
  // Lines 24-96: All useState declarations
  const [email, setEmail] = useState("");
  // ... all other hooks ...

  // Lines 98-120: All useEffect hooks
  useEffect(() => {
    /* ... */
  }, []);
  useEffect(() => {
    /* ... */
  }, []);
  useEffect(() => {
    /* navigation */
  }, [currentUser, isLoading, navigate]);

  // ✅ MOVED HERE: Handle password errors
  useEffect(() => {
    if (error && error.toLowerCase().includes("password")) {
      displayToast(error, "error");
      clearError();
    }
  }, [error, clearError]);

  // Early return AFTER all hooks
  if (isLoading || currentUser) {
    return <LoadingSkeleton />;
  }

  return <MainComponent />;
};
```

## Changes Made

**File:** `GSM/src/pages/GatewayLogin.tsx`

1. **Moved `useEffect` hook** from line 711 to line 122 (before early return)
2. **Removed duplicate hook** that was after the early return
3. **Verified** all hooks are now called before any conditional returns

## Testing Checklist

After this fix, test the following scenarios:

- [ ] Login as regular user → should redirect to `/portal` without errors
- [ ] Login as admin → should redirect to `/admin` without errors
- [ ] Login as staff → should redirect to `/admin` without errors
- [ ] Login as partner school rep → should redirect to `/partner-school` without errors
- [ ] Check browser console for React errors
- [ ] Verify no error #300 appears after login
- [ ] Refresh page after login → should remain stable

## Prevention Guidelines

To avoid this error in the future:

### ✅ DO:

```tsx
const MyComponent = () => {
  // 1. All hooks at the top
  const [state, setState] = useState();
  useEffect(() => {}, []);

  // 2. Early returns AFTER all hooks
  if (loading) return <Loading />;

  // 3. Component logic
  return <div>...</div>;
};
```

### ❌ DON'T:

```tsx
const MyComponent = () => {
  const [state, setState] = useState();

  if (loading) return <Loading />; // ❌ Early return before all hooks

  useEffect(() => {}, []); // ❌ Hook after conditional return

  return <div>...</div>;
};
```

### ❌ DON'T:

```tsx
const MyComponent = () => {
  if (condition) {
    const [state, setState] = useState(); // ❌ Hook inside condition
  }
  return <div>...</div>;
};
```

## Related Files Checked

The following files were also reviewed and found to be correct:

✅ `GSM/src/pages/auth/Login.tsx` - All hooks before early return  
✅ `GSM/src/components/ProtectedRoute.tsx` - All hooks before early return  
✅ `GSM/src/App.tsx` - No hook ordering issues

## Additional Resources

- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [React Error Decoder - Error #300](https://reactjs.org/docs/error-decoder.html?invariant=300)
- [Why Hooks Must Be Called in Order](https://react.dev/learn/state-a-components-memory#meet-your-first-hook)

## Status

✅ **FIXED** - Error #300 should no longer occur after login
