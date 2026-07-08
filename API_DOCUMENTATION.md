# GrowEasy CSV Importer - API Documentation

## Overview
Production-ready AI-powered CSV importer for GrowEasy CRM. Supports arbitrary CSV sources, semantic AI extraction, and full import job lifecycle tracking.

## Base URL
```
http://localhost:4000
```

---

## Endpoints

### 1. Health Check
**GET** `/health`

**Response:**
```json
{ "status": "ok" }
```

---

### 2. Preview CSV
**POST** `/api/import/preview`

Upload a CSV file to preview headers and first 25 rows.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:** 
  - `file` (required): CSV file, max 5MB

**Response (200):**
```json
{
  "headers": ["Name", "Email", "Phone", "Company"],
  "rows": [
    {
      "Name": "John Doe",
      "Email": "john@example.com",
      "Phone": "9876543210",
      "Company": "Tech Corp"
    }
  ]
}
```

**Errors:**
- **400:** No file uploaded
- **400:** Invalid CSV format
- **413:** File size exceeds 5MB

---

### 3. Process & Import CSV
**POST** `/api/import/process`

Process CSV with AI extraction, validation, and database persistence.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:** 
  - `file` (required): CSV file, max 5MB

**Response (200):**
```json
{
  "imported": 45,
  "skipped": 5,
  "totalRows": 50,
  "records": [
    {
      "sourceRowIndex": 1,
      "status": "imported",
      "confidence": 0.95,
      "data": {
        "created_at": "2024-01-15",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "country_code": "+91",
        "mobile_without_country_code": "9876543210",
        "company": "GrowEasy",
        "city": "Bengaluru",
        "state": "KA",
        "country": "India",
        "lead_owner": "Sales",
        "crm_status": "GOOD_LEAD_FOLLOW_UP",
        "crm_note": "Interested in demo",
        "data_source": "leads_on_demand",
        "possession_time": "Q2 2024",
        "description": "High-priority lead"
      }
    }
  ],
  "skippedRecords": [
    {
      "sourceRowIndex": 2,
      "reason": "Missing both email and mobile number"
    }
  ]
}
```

**Field Mappings (Automatic):**
The AI extracts and maps to these CRM fields:

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | ISO 8601 | Date when lead was created |
| `name` | string | Lead contact name |
| `email` | string | Lead email address |
| `country_code` | string | Phone country code (e.g., +91) |
| `mobile_without_country_code` | string | Phone number without country code |
| `company` | string | Company name |
| `city` | string | City |
| `state` | string | State/Province |
| `country` | string | Country |
| `lead_owner` | string | Sales rep or owner |
| `crm_status` | enum | One of: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE` |
| `crm_note` | string | Internal notes |
| `data_source` | enum | One of: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` |
| `possession_time` | string | Expected possession timeline |
| `description` | string | Lead description |

**Errors:**
- **400:** No file uploaded
- **400:** Invalid CSV format
- **413:** File size exceeds 5MB
- **500:** Processing failed (check server logs)

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/groweasy
PORT=4000
OPENAI_API_KEY=sk-...  # Optional: leave empty for fallback extractor
AI_MODEL=gpt-4o-mini
BATCH_SIZE=10
```

---

## Database Models

### ImportJob
Tracks each import session.
```
- id: UUID
- fileName: string
- fileSize: number
- totalRows: number
- totalImported: number
- totalSkipped: number
- status: "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED"
- createdAt: timestamp
- updatedAt: timestamp
```

### CrmLead
Successfully imported leads.
```
- id: UUID
- importJobId: UUID (foreign key)
- rawRowId: UUID (foreign key to raw row)
- All CRM fields (name, email, phone, etc.)
- aiConfidence: 0-1 (AI extraction confidence)
```

### SkippedRecord
Rows that failed validation.
```
- id: UUID
- importJobId: UUID
- rawRowId: UUID
- reason: string (why it was skipped)
- rawData: JSON (original row data)
```

### AiBatch
Tracks AI processing batches.
```
- id: UUID
- importJobId: UUID
- batchNumber: number
- status: "PENDING" | "COMPLETED" | "FAILED"
- inputPayload: JSON (headers + rows)
- outputPayload: JSON (AI response)
- errorMessage: string (if failed)
- retryCount: number
```

---

## Validation Rules

**Row Rejection:**
- ❌ Missing both email AND mobile number → SKIPPED

**Status Enum Values:**
```
GOOD_LEAD_FOLLOW_UP
DID_NOT_CONNECT
BAD_LEAD
SALE_DONE
```

**Data Source Enum Values:**
```
leads_on_demand
meridian_tower
eden_park
varah_swamy
sarjapur_plots
```

---

## AI Extraction Logic

### Semantic Mapping
The AI doesn't use hardcoded mappings. Instead:
1. Reads CSV headers
2. Infers field meanings semantically
3. Maps to GrowEasy schema intelligently

### Example CSV Headers → Auto-Mapping
```
Input: "Customer Full Name" → Output: name
Input: "Contact Email" → Output: email
Input: "Mobile Number" → Output: mobile_without_country_code
Input: "Company Name" → Output: company
Input: "Purchase Timeline" → Output: possession_time
```

### Fallback Extraction
If OpenAI API is unavailable:
1. Email regex: `/@/`
2. Phone regex: `/\d{7,}/`
3. Date regex: ISO/common formats
4. Field matching: Case-insensitive key matching

---

## Performance Notes

- **Batch Size:** Default 10 rows per AI call (configurable via `BATCH_SIZE`)
- **Max File Size:** 5MB
- **Rate Limiting:** Depends on OpenAI quotas
- **Database:** PostgreSQL optimized for concurrent imports

---

## Error Handling

All errors return JSON:
```json
{ "message": "Error description" }
```

**HTTP Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid input
- `413 Payload Too Large` - File exceeds 5MB
- `500 Internal Server Error` - Server error

---

## Example Workflow

```bash
# 1. Preview
curl -X POST http://localhost:4000/api/import/preview \
  -F "file=@leads.csv"

# 2. Process
curl -X POST http://localhost:4000/api/import/process \
  -F "file=@leads.csv"

# 3. Check database
npm exec prisma studio
```

---

## Development

**Run tests:**
```bash
npm run test --workspace backend
```

**Generate Prisma Client:**
```bash
npm exec prisma generate
```

**Run migrations:**
```bash
npm exec prisma migrate dev
```

**View database:**
```bash
npm exec prisma studio
```
