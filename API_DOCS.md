# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints support JWT bearer tokens:

```
Authorization: Bearer <token>
```

## Endpoints

### Policies

#### List Policies
```
GET /policies?page=1&limit=10&search=&status=Active
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by policy number, member name, or ID
- `status` (string): Filter by status (Active, Expired, Suspended)

**Response:**
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "policyNumber": "POL-2024-123456",
        "memberName": "John Doe",
        "memberId": "MEM-12345678",
        "policyType": "Individual",
        "sumInsured": 500000,
        "status": "Active",
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

#### Get Policy Details
```
GET /policies/:policyNumber
```

**Response:**
```json
{
  "success": true,
  "data": {
    "policyNumber": "POL-2024-123456",
    "memberName": "John Doe",
    "memberId": "MEM-12345678",
    "dob": "1990-05-12T00:00:00Z",
    "policyType": "Individual",
    "sumInsured": 500000,
    "deductible": 5000,
    "coPay": 10,
    "status": "Active",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2025-01-01T00:00:00Z",
    "eligible": true
  }
}
```

#### Create Policy
```
POST /policies
Content-Type: application/json

{
  "policyNumber": "POL-2024-123456",
  "memberId": "MEM-12345678",
  "memberName": "John Doe",
  "dob": "1990-05-12T00:00:00Z",
  "gender": "Male",
  "email": "john@example.com",
  "phone": "+919876543210",
  "policyType": "Individual",
  "sumInsured": 500000,
  "deductible": 5000,
  "coPay": 10,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2025-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Policy created successfully"
}
```

### Claims

#### List Claims
```
GET /claims?page=1&limit=10&status=Pending
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (Pending, Approved, Rejected, Under Review)

#### Create Claim
```
POST /claims
Content-Type: application/json

{
  "claimNumber": "CLM-2024-654321",
  "policyNumber": "POL-2024-123456",
  "memberName": "John Doe",
  "hospitalName": "Apollo Hospital",
  "claimAmount": 50000,
  "admissionDate": "2024-06-01T10:00:00Z",
  "dischargeDate": "2024-06-07T16:00:00Z"
}
```

#### Validate Claim
```
POST /claims/validate
Content-Type: application/json

{
  "policyNumber": "POL-2024-123456",
  "claimNumber": "CLM-2024-654321",
  "claimAmount": 50000,
  "hospitalName": "Apollo Hospital",
  "admissionDate": "2024-06-01T10:00:00Z",
  "dischargeDate": "2024-06-07T16:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validationStatus": "APPROVED",
    "policyNumber": "POL-2024-123456",
    "claimNumber": "CLM-2024-654321",
    "claimAmount": 50000,
    "approvedAmount": 42500,
    "eligible": true,
    "remarks": "Claim approved. Approved amount after deductible and co-pay: 42500"
  }
}
```

### Health Check
```
POST /health
```

**Response:**
```json
{
  "message": "Health check passed",
  "timestamp": "2024-06-07T10:30:45Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Policy number already exists"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Policy not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

Coming soon. Currently no rate limiting is enforced.

## Webhooks

### Claim Status Update
```
POST {webhook_url}
Content-Type: application/json

{
  "event": "claim.status_updated",
  "data": {
    "claimNumber": "CLM-2024-654321",
    "status": "Approved",
    "approvedAmount": 42500,
    "timestamp": "2024-06-07T10:30:45Z"
  }
}
```

## Examples

### Using cURL

```bash
# Get policy details
curl -X GET http://localhost:3000/api/policies/POL-2024-123456 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create policy
curl -X POST http://localhost:3000/api/policies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "policyNumber": "POL-2024-123456",
    "memberName": "John Doe",
    ...
  }'

# Validate claim
curl -X POST http://localhost:3000/api/claims/validate \
  -H "Content-Type: application/json" \
  -d '{
    "policyNumber": "POL-2024-123456",
    "claimNumber": "CLM-2024-654321",
    "claimAmount": 50000,
    ...
  }'
```

### Using JavaScript/Fetch

```javascript
// Get policy
const response = await fetch('/api/policies/POL-2024-123456', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();
console.log(data);
```

## Changelog

### v1.0.0 (June 2024)
- Initial release
- Core policy and claims management
- Basic validation APIs
- Dashboard with statistics
