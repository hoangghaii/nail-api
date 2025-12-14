# Mongoose Duplicate Index Investigation Report

**Date:** 2025-12-13
**Issue:** Duplicate schema index on {"email":1} warning

## Executive Summary

**Root Cause:** Admin schema declares unique index on email field TWICE - once via `@Prop({ unique: true })` and again via `AdminSchema.index()`.

**Impact:** Non-critical warning but indicates redundant index definition. May cause confusion during maintenance.

**Recommendation:** Remove explicit `AdminSchema.index({ email: 1 })` call since `unique: true` already creates unique index.

## Technical Analysis

### Schema Files Examined

1. `/src/modules/auth/schemas/admin.schema.ts` - **DUPLICATE FOUND**
2. `/src/modules/contacts/schemas/contact.schema.ts` - No duplicate
3. `/src/modules/business-info/schemas/business-info.schema.ts` - No duplicate

### Detailed Findings

#### Admin Schema (DUPLICATE INDEX ISSUE)

**File:** `/src/modules/auth/schemas/admin.schema.ts`

**Lines 11-12:** Email field with `unique: true`
```typescript
@Prop({ required: true, unique: true })
email: string;
```

**Line 33:** Explicit index declaration
```typescript
AdminSchema.index({ email: 1 }, { unique: true });
```

**Analysis:**
- `@Prop({ unique: true })` automatically creates unique index via Mongoose
- Line 33 explicitly creates same index again
- This is the source of duplicate index warning

#### Contact Schema (NO DUPLICATE)

**File:** `/src/modules/contacts/schemas/contact.schema.ts`

**Lines 14-15:** Email field WITHOUT unique constraint
```typescript
@Prop({ required: true })
email: string;
```

**Line 44:** Explicit non-unique index
```typescript
ContactSchema.index({ email: 1 });
```

**Analysis:** No duplication - field has no `unique: true`, only explicit index for query optimization.

#### Business Info Schema (NO DUPLICATE)

**File:** `/src/modules/business-info/schemas/business-info.schema.ts`

**Lines 38-39:** Email field WITHOUT any index
```typescript
@Prop({ required: true })
email: string;
```

**Analysis:** No index declarations at all - no duplication.

### Root Cause Chain

1. Developer adds `unique: true` to Admin email field (line 11)
2. Mongoose automatically creates unique index from decorator
3. Developer explicitly adds index again (line 33) - likely unaware decorator already creates it
4. Mongoose detects duplicate index definition during schema compilation
5. Warning emitted: "Duplicate schema index on {"email":1}"

## Recommended Fix

### Option 1: Remove Explicit Index (RECOMMENDED)

**File:** `/src/modules/auth/schemas/admin.schema.ts`
**Action:** Delete line 33

```typescript
// Remove this line:
AdminSchema.index({ email: 1 }, { unique: true });
```

**Rationale:**
- `@Prop({ unique: true })` already creates index
- Simpler, more maintainable code
- Follows DRY principle

### Option 2: Remove Decorator Constraint

**File:** `/src/modules/auth/schemas/admin.schema.ts`
**Action:** Modify line 11 and keep line 33

```typescript
// Change from:
@Prop({ required: true, unique: true })

// To:
@Prop({ required: true })

// Keep:
AdminSchema.index({ email: 1 }, { unique: true });
```

**Rationale:**
- Centralizes all index definitions
- More explicit control over indexes
- Better for complex index configurations

### Verification Steps

After fix:
1. Restart application
2. Check logs for duplicate index warning
3. Verify email uniqueness still enforced
4. Test admin creation with duplicate email (should fail)

## Supporting Evidence

### Grep Results

```bash
# Email field declarations with unique constraint:
src/modules/auth/schemas/admin.schema.ts:11:  @Prop({ required: true, unique: true })

# Explicit index declarations on email:
src/modules/auth/schemas/admin.schema.ts:33:AdminSchema.index({ email: 1 }, { unique: true });
src/modules/bookings/schemas/booking.schema.ts:51:BookingSchema.index({ 'customerInfo.email': 1 });
src/modules/contacts/schemas/contact.schema.ts:44:ContactSchema.index({ email: 1 });
```

### Mongoose Index Behavior

When `@Prop({ unique: true })` is used:
- Mongoose creates index definition: `{ email: 1 }` with `{ unique: true }`
- Equivalent to calling `schema.index({ email: 1 }, { unique: true })`
- Second call creates duplicate definition

## Impact Assessment

**Severity:** Low
- No functional impact
- No performance degradation
- Only affects development/production logs

**Risk of Fix:** Minimal
- Removing redundant code
- Unique constraint remains enforced
- No schema migration needed

## Unresolved Questions

None - root cause confirmed, fix straightforward.
