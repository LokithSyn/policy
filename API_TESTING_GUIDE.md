# IntelliPolicy API Testing Guide

After running `npm run dev`, the Next.js dev server will be running on `http://localhost:3000`.

## Testing the APIs

### 1. Get a Policy Number from the Database

First, you need a valid policy number from the seeded data. You can use any policy with format `POL-2026-XXXXXX`.

Example policy numbers from the seed:
- `POL-2026-000001` (first policy)
- `POL-2026-000500` (middle)
- `POL-2026-001000` (last)

### 2. Test Endpoints

#### List Policies (with pagination)
```bash
curl "http://localhost:3000/api/policies?page=1&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "policyId": "POL-2026-000001",
        "policyNumber": "POL-2026-000001",
        "customerId": "CUST-2026-000001",
        "policyType": "Motor",
        "sumInsured": 1234567,
        "policyStatus": "ACTIVE",
        "effectiveDate": "2025-01-15T00:00:00Z",
        "expiryDate": "2026-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1000,
      "pages": 100
    }
  }
}
```

---

#### Get Single Policy Details
```bash
curl "http://localhost:3000/api/policies/POL-2026-000001"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "policyId": "POL-2026-000001",
    "policyNumber": "POL-2026-000001",
    "customerId": "CUST-2026-000001",
    "customerName": "Rajesh Kumar",
    "policyType": "Motor",
    "sumInsured": 1500000,
    "policyStatus": "ACTIVE",
    "effectiveDate": "2025-01-15T00:00:00Z",
    "expiryDate": "2026-01-15T00:00:00Z",
    "premiumAmount": 45000,
    "insurerName": "New India Assurance",
    "eligible": true
  }
}
```

---

#### Get Policy Coverages
```bash
curl "http://localhost:3000/api/policies/POL-2026-000001/coverage"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "policyId": "POL-2026-000001",
    "policyNumber": "POL-2026-000001",
    "coverages": [
      {
        "coverageId": "COV-2026-000001",
        "coverageCode": "OD",
        "coverageName": "Own Damage",
        "coverageLimit": 1000000,
        "deductible": 5000,
        "status": "ACTIVE"
      },
      {
        "coverageId": "COV-2026-000002",
        "coverageCode": "TP",
        "coverageName": "Third Party Liability",
        "coverageLimit": 500000,
        "deductible": 0,
        "status": "ACTIVE"
      }
    ]
  }
}
```

---

#### Get Policy Claims History
```bash
curl "http://localhost:3000/api/policies/POL-2026-000001/claims"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "policyId": "POL-2026-000001",
    "policyNumber": "POL-2026-000001",
    "claimCount": 2,
    "claims": [
      {
        "claimId": "CLM-2026-000001",
        "claimNumber": "CLM-2026-000001",
        "incidentDate": "2025-11-20T00:00:00Z",
        "claimAmount": 150000,
        "approvedAmount": 140000,
        "claimStatus": "APPROVED",
        "claimType": "OWN_DAMAGE"
      }
    ]
  }
}
```

---

#### Verify a Policy (Get Policy Summary)
```bash
curl "http://localhost:3000/api/policies/verify/POL-2026-000001"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "policyStatus": "ACTIVE",
    "customerName": "Rajesh Kumar",
    "coverageAvailable": true,
    "claimCount": 2,
    "fraudAlert": false
  }
}
```

---

#### Validate a Claim (With Fraud Detection)
```bash
curl -X POST "http://localhost:3000/api/claims/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "policyNumber": "POL-2026-000001",
    "claimAmount": 250000
  }'
```

**Response (Valid Claim):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "policyStatus": "ACTIVE",
    "customerName": "Rajesh Kumar",
    "coverageAvailable": true,
    "claimCount": 2,
    "fraudAlert": false,
    "approvedAmount": 250000
  }
}
```

**Response (Fraud Alert - > 3 claims in 12 months):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "policyStatus": "ACTIVE",
    "customerName": "Rajesh Kumar",
    "coverageAvailable": true,
    "claimCount": 4,
    "fraudAlert": true,
    "approvedAmount": 250000
  }
}
```

---

#### Get Customer Details
First, find a customer ID from the seeded data (format: `CUST-2026-XXXXXX`)

```bash
curl "http://localhost:3000/api/customers/CUST-2026-000001"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customerId": "CUST-2026-000001",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "customerType": "Individual",
    "email": "customer0@example.com",
    "mobile": "9876543210",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "policyCount": 3,
    "policies": [
      {
        "policyId": "POL-2026-000001",
        "policyNumber": "POL-2026-000001",
        "policyType": "Motor",
        "policyStatus": "ACTIVE",
        "effectiveDate": "2025-01-15T00:00:00Z",
        "expiryDate": "2026-01-15T00:00:00Z"
      }
    ]
  }
}
```

---

#### Get Vehicle Details
First, find a registration number from seeded assets (format: `TN09AB1234`)

```bash
curl "http://localhost:3000/api/vehicles/TN09AB1234"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assetId": "AST-2026-000001",
    "registrationNumber": "TN09AB1234",
    "chassisNumber": "CH123456789",
    "make": "Maruti",
    "modelName": "Swift",
    "manufacturingYear": 2023,
    "assetType": "FourWheeler",
    "fuelType": "Petrol",
    "insuredValue": 1200000,
    "marketValue": 1350000,
    "policy": {
      "policyId": "POL-2026-000001",
      "policyNumber": "POL-2026-000001",
      "policyStatus": "ACTIVE",
      "sumInsured": 1500000,
      "expiryDate": "2026-01-15T00:00:00Z"
    }
  }
}
```

---

#### View OpenAPI/Swagger Spec
```bash
curl "http://localhost:3000/api/docs"
```

Returns the full OpenAPI 3.0 specification as JSON.

---

## Testing Fraud Detection

The fraud detection logic flags policies with > 3 claims in the last 12 months.

**To trigger fraudAlert:**
1. Find a policy that has 4+ claims in the seeded data
2. Call `/api/claims/validate` for that policy
3. You should see `"fraudAlert": true` in the response

---

## Common Issues & Troubleshooting

### "Policy not found" (404)
- Make sure the policyNumber is in the correct format: `POL-2026-XXXXXX`
- Verify the policy was seeded successfully by checking the seed output
- Policy must exist in the database

### "No active coverage found" (rejection)
- The policy might not have any ACTIVE coverages
- Check `/api/policies/:policyNumber/coverage` to see coverage status
- Coverage must have `status: "ACTIVE"`

### "Policy expired" (rejection)
- The policy's `expiryDate` is in the past
- Check the policy details to see the current expiry date
- Only ACTIVE policies with future expiry dates are eligible

### Fraud Alert Not Triggering
- The fraud logic counts claims with `incidentDate` in the last 12 months
- A policy needs > 3 qualifying claims to trigger the alert
- Seeded claims are distributed randomly, so not all policies will have fraud alerts

---

## Performance Notes

- **List endpoint pagination:** Use `?page=1&limit=10` for large result sets
- **Indexes:** All key fields (policyNumber, customerId, registrationNumber) are indexed for fast lookups
- **Populate optimization:** Policy details use `.populate('customer agent')` to fetch related documents in one query
- **Large datasets:** The seed creates 5,000+ records, so test with realistic data volumes

---

## Next: Frontend Integration

After validating the APIs work correctly, update the frontend pages:
- `/src/app/policies/page.tsx` — Call `/api/policies` and display results
- `/src/app/claims/page.tsx` — Call `/api/claims/validate` for claim submission
- `/src/app/dashboard/page.tsx` — Display policy stats from `/api/policies`

---

**Last Updated:** 2026-06-11 | **Status:** Ready for Manual Testing
