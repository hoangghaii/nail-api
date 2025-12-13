# API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000`

## Authentication

All protected endpoints require Bearer token:
```
Authorization: Bearer <access_token>
```

## Enums

### ServiceCategory
- `extensions`, `manicure`, `nail-art`, `pedicure`, `spa`

### GalleryCategory
- `all`, `extensions`, `manicure`, `nail-art`, `pedicure`, `seasonal`

### BookingStatus
- `pending`, `confirmed`, `completed`, `cancelled`

## Business Hours
Booking time slots: **09:00-17:30** (30-min intervals)

Available: 09:00, 09:30, 10:00, ..., 17:30

## Pagination
- Default: page=1, limit=10
- Max limit: 100
- Min: page=1, limit=1

---

See full endpoint details in implementation or use Swagger (coming soon).
