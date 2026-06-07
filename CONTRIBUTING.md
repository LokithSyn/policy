# IntelliPolicy - Contributing Guide

## Development Workflow

### 1. Setup Development Environment

```bash
npm install
npm run dev
```

### 2. Project Structure

```
src/
├── app/          # Next.js pages and API routes
├── components/   # React components
├── lib/          # Utilities and helpers
├── models/       # Mongoose schemas
├── scripts/      # Utility scripts
└── middleware/   # Next.js middleware
```

### 3. Code Standards

- **TypeScript**: Strict mode enabled - always type your code
- **Components**: Prefer functional components with hooks
- **Styling**: Use Tailwind CSS with responsive classes
- **API**: Follow RESTful conventions
- **Database**: Use Mongoose models with proper validation

### 4. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### 5. Commit Message Convention

```
feat: Add new feature
fix: Fix a bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## Testing

### Run Tests
```bash
npm test
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Adding New Features

### 1. Policy Features

**Location**: `src/app/policies/`

Create page or component:
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function FeatureName() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/policies');
      const result = await res.json();
      setData(result.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

### 2. API Endpoints

**Location**: `src/app/api/`

Create route handler:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Your logic here

    return NextResponse.json(successResponse(data));
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
```

### 3. Database Models

**Location**: `src/models/`

Create model:
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IYourModel extends Document {
  field1: string;
  field2: number;
}

const YourSchema = new Schema<IYourModel>({
  field1: { type: String, required: true },
  field2: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.YourModel ||
  mongoose.model<IYourModel>('YourModel', YourSchema);
```

### 4. UI Components

**Location**: `src/components/ui/` or `src/components/dashboard/`

Create component:
```typescript
export interface YourComponentProps {
  title: string;
  value: number;
}

export function YourComponent({ title, value }: YourComponentProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
```

## Database Management

### View Collections
```bash
# Connect to MongoDB
mongosh "your_mongodb_uri"

# List databases
show dbs

# Use database
use intellipolicy

# List collections
show collections

# View data
db.policies.find().limit(5)
```

### Create Indexes
```bash
# Policies
db.policies.createIndex({ policyNumber: 1 }, { unique: true })
db.policies.createIndex({ status: 1 })

# Claims
db.claims.createIndex({ claimNumber: 1 }, { unique: true })
db.claims.createIndex({ policyNumber: 1 })
```

## Debugging

### Enable Debug Mode
```bash
DEBUG=intellipolicy:* npm run dev
```

### Check Logs
```bash
# View server logs
tail -f logs/server.log

# View error logs
tail -f logs/error.log
```

### Common Issues

1. **MongoDB Connection Error**
   - Check `MONGODB_URI` in `.env.local`
   - Ensure IP is whitelisted in Atlas
   - Verify username/password

2. **API Not Responding**
   - Check server is running
   - Verify port 3000 is available
   - Check firewall settings

3. **Type Errors**
   - Run `npm run type-check`
   - Import types correctly
   - Check interface definitions

## Performance Optimization

### Frontend
- Use React.memo for expensive components
- Implement lazy loading for images
- Use dynamic imports for large components

### Backend
- Add database indexes for frequently queried fields
- Implement caching for read-heavy operations
- Use pagination for large datasets

### Database
- Monitor query performance
- Archive old records
- Regular backups

## Security Checklist

- [ ] No secrets in code
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS prevention (React built-in)
- [ ] CSRF protection for forms
- [ ] Rate limiting on APIs
- [ ] HTTPS in production

## Deployment Checklist

- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Type checking passes
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Security headers set
- [ ] Performance tested

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Mongoose Docs](https://mongoosejs.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Support

For questions or issues:
1. Check existing GitHub issues
2. Create a new issue with details
3. Join our Discord community

---

Thank you for contributing to IntelliPolicy!
