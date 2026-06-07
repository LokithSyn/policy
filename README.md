# IntelliPolicy - Insurance Policy Management Portal

A production-ready insurance policy management and verification portal built with Next.js 15, TypeScript, MongoDB, and Auth0.

## Features

- 📋 **Policy Management**: Create, update, and manage insurance policies
- 🏥 **Claims Processing**: Submit, verify, and track insurance claims
- 📊 **Dashboard**: Real-time statistics and activity tracking
- 🔐 **Secure APIs**: JWT and API key authentication
- 📱 **Responsive Design**: Modern, mobile-friendly UI
- 🌙 **Dark Mode Support**: Built-in theme switching
- 🔄 **IntelliDoc Integration**: APIs for external claim validation
- 📈 **Audit Logging**: Complete audit trail for compliance

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: Auth0
- **Deployment**: Vercel
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Auth0 account
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   cd policy
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add:
   - `MONGODB_URI`: Your MongoDB connection string
   - Auth0 credentials (CLIENT_ID, CLIENT_SECRET, etc.)
   - `JWT_SECRET`: A secure random string

3. **Seed sample data (optional)**
   ```bash
   npm run seed
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Setup

### Using Docker Compose

```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- IntelliPolicy app on port 3000

Access the app at `http://localhost:3000`

### Manual Docker Build

```bash
docker build -t intellipolicy .
docker run -p 3000:3000 --env-file .env.local intellipolicy
```

## API Endpoints

### Policies

- `GET /api/policies` - List all policies (with pagination, search, filters)
- `GET /api/policies/:policyNumber` - Get policy details
- `POST /api/policies` - Create a new policy

### Claims

- `GET /api/claims` - List all claims
- `POST /api/claims` - Submit a new claim
- `POST /api/claims/validate` - Validate a claim against a policy

### Health Check

- `POST /api/health` - Check API health

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard page
│   ├── policies/         # Policies management
│   ├── claims/           # Claims management
│   ├── settings/         # Settings page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   └── dashboard/       # Dashboard components
├── models/              # Mongoose schemas
├── lib/
│   ├── db/              # Database utilities
│   ├── auth.ts          # Authentication utilities
│   └── api-response.ts  # API response helpers
├── scripts/
│   └── seed.ts          # Data seeding script
└── middleware/          # Next.js middleware

```

## Database Schema

### Policy
```javascript
{
  policyNumber: String (unique),
  memberId: String,
  memberName: String,
  dob: Date,
  gender: String,
  email: String,
  phone: String,
  policyType: String,
  sumInsured: Number,
  deductible: Number,
  coPay: Number,
  startDate: Date,
  endDate: Date,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Claim
```javascript
{
  claimNumber: String (unique),
  policyNumber: String,
  memberName: String,
  hospitalName: String,
  claimAmount: Number,
  approvedAmount: Number,
  claimDate: Date,
  admissionDate: Date,
  dischargeDate: Date,
  status: String,
  reason: String,
  createdAt: Date,
  updatedAt: Date
}
```

## IntelliDoc Integration

The policy validation API is designed for integration with IntelliDoc:

```bash
POST /api/claims/validate

Request:
{
  "policyNumber": "POL-2024-123456",
  "claimNumber": "CLM-2024-654321",
  "claimAmount": 50000,
  "hospitalName": "Apollo Hospital",
  "admissionDate": "2024-06-01T10:00:00Z",
  "dischargeDate": "2024-06-07T16:00:00Z"
}

Response:
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

## Authentication

### Auth0 Setup

1. Create an Auth0 application
2. Set up a Regular Web Application
3. Configure callback URLs: `http://localhost:3000/api/auth/callback`
4. Add logout URL: `http://localhost:3000/api/auth/logout`
5. Copy credentials to `.env.local`

### API Authentication

Currently supports:
- JWT tokens (Bearer token in Authorization header)
- API key authentication (X-API-Key header)

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

```bash
vercel deploy
```

### Environment Variables for Production

Set in your hosting platform:
- `MONGODB_URI`: Production MongoDB Atlas URI
- `NODE_ENV`: production
- `AUTH0_SECRET`: Generate with: `openssl rand -hex 32`
- All Auth0 credentials
- `JWT_SECRET`: Strong random string

## Monitoring & Logging

- All API requests are logged
- Audit logs track policy and claim changes
- Activity feed shows recent actions on dashboard

## Security

- ✅ HTTPS in production
- ✅ JWT and API key authentication
- ✅ Rate limiting ready
- ✅ CORS configured
- ✅ Input validation with Zod
- ✅ Audit logging enabled

## Sample Data

Run the seed script to generate:
- 100 sample policies
- 200 sample claims
- 50 sample users
- 100 audit log entries

```bash
npm run seed
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or Atlas URI is correct
- Check firewall/network settings
- Verify IP whitelist in MongoDB Atlas

### Auth0 Integration
- Double-check AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET
- Verify callback URLs match in Auth0 dashboard
- Check AUTH0_ISSUER_BASE_URL format

### Build Errors
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Check TypeScript errors: `npm run type-check`

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT

## Support

For issues and questions:
1. Check the [documentation](https://nextjs.org)
2. Review API endpoints
3. Check console logs for errors
4. Verify environment variables

---

**Created for IntelliDoc - Insurance Claims Intelligence Platform**

Last Updated: June 2024
