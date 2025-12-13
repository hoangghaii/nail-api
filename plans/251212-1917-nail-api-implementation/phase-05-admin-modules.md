# Phase 05: Admin Modules

**Phase ID:** 05
**Priority:** MEDIUM
**Duration:** 4-5 days
**Dependencies:** Phase 04

---

## Overview

Implement Banners, Contacts, BusinessInfo, HeroSettings modules (all admin-only).

---

## Modules Overview

### Banners Module
- CRUD for hero section banners
- Endpoints: `GET /banners`, `POST /banners`, `PATCH /banners/:id`, `DELETE /banners/:id`
- All protected by JWT guard

### Contacts Module
- View customer inquiries
- Update status (new → read → replied)
- Endpoints: `GET /contacts`, `GET /contacts/:id`, `PATCH /contacts/:id/status`

### BusinessInfo Module
- Single document (only one business info record)
- Endpoints: `GET /business-info`, `PATCH /business-info`

### HeroSettings Module
- Configure hero section display mode
- Endpoints: `GET /hero-settings`, `PATCH /hero-settings`

---

## Implementation Pattern

All modules follow same pattern:
1. Schema (already created in Phase 02)
2. DTOs with validation
3. Service with CRUD methods
4. Controller with JWT guard
5. Module registration

---

## Success Criteria

- [ ] All admin modules protected by JWT
- [ ] Contacts can be filtered by status
- [ ] BusinessInfo update works
- [ ] HeroSettings supports all display modes

---

## Next Steps

Move to [Phase 06: Security](./phase-06-security.md)
