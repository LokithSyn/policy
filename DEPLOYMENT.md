# Deployment Guide

## Vercel Deployment (Recommended)

### Step 1: Prepare Your Repository

1. Ensure all code is committed and pushed to GitHub
2. Verify `.env.example` is in the repo (but not `.env.local`)
3. Confirm `package.json` and `package-lock.json` are present

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select "Next.js" as the framework (auto-detected)
5. Click "Deploy"

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
MONGODB_URI=your_mongodb_atlas_uri
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=https://your-domain.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret (generate with: openssl rand -hex 32)
```

### Step 4: Update Auth0 Settings

1. Go to Auth0 Dashboard
2. Application Settings → Allowed Callback URLs:
   - Add: `https://your-domain.vercel.app/api/auth/callback`
3. Allowed Logout URLs:
   - Add: `https://your-domain.vercel.app`

### Step 5: Deploy

Click "Deploy" - your app will be live in ~3-5 minutes!

## Manual Deployment

### Docker on AWS EC2

```bash
# SSH into EC2 instance
ssh -i key.pem ubuntu@your-instance

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose

# Clone repository
git clone https://github.com/your-org/intellipolicy.git
cd intellipolicy

# Create .env.local
cat > .env.local << EOF
MONGODB_URI=your_mongodb_uri
AUTH0_SECRET=your_secret
...
EOF

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### Railway.app Deployment

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables
5. Add MongoDB plugin
6. Deploy automatically

### Google Cloud Run

```bash
# Build image
gcloud builds submit --tag gcr.io/your-project/intellipolicy

# Deploy
gcloud run deploy intellipolicy \
  --image gcr.io/your-project/intellipolicy \
  --platform managed \
  --region us-central1 \
  --set-env-vars MONGODB_URI=... \
  --memory 512Mi
```

## Production Checklist

- [ ] MongoDB Atlas is set up with proper backups
- [ ] Auth0 production tenant is configured
- [ ] All environment variables are set
- [ ] HTTPS is enabled
- [ ] Database indexes are created
- [ ] Error logging is configured
- [ ] Email notifications are tested
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Security headers are set

## Scaling Considerations

### Database
- Use MongoDB Atlas auto-scaling
- Enable connection pooling
- Set up read replicas for high traffic

### API
- Enable Vercel edge caching
- Use Incremental Static Regeneration (ISR)
- Implement API rate limiting

### Frontend
- Enable Next.js Image Optimization
- Use dynamic imports for large components
- Implement lazy loading for tables

## Monitoring

### Vercel Analytics
- Built-in monitoring dashboard
- Real-time logs accessible
- Error tracking included

### Custom Monitoring
```javascript
// Add to your API routes for monitoring
console.log({
  timestamp: new Date(),
  method: request.method,
  path: request.nextUrl.pathname,
  duration: Date.now() - startTime,
});
```

## Troubleshooting Deployment

### Build Fails
```bash
# Check build logs in Vercel
vercel logs --follow

# Local build test
npm run build
```

### Connection Timeout
- Verify MongoDB URI includes all parameters
- Check IP whitelist in MongoDB Atlas
- Verify firewall settings

### Auth0 Errors
- Verify callback URLs exactly match
- Check client credentials
- Review Auth0 logs

## Rollback

### Vercel
1. Go to Deployments tab
2. Select previous version
3. Click "Promote to Production"

### Docker
```bash
docker-compose down
git checkout previous-version
docker-compose up -d
```

## Continuous Deployment

### Automated Deployments
- Every push to `main` branch automatically deploys to Vercel
- Set up branch previews for pull requests
- Configure status checks before merge

### Database Migrations
- Mongoose handles schema updates
- Keep migration scripts in `/src/scripts/`
- Test thoroughly before production

## Backup & Recovery

### MongoDB Backups
1. Enable automated backups in MongoDB Atlas
2. Configure point-in-time recovery
3. Test restore procedures monthly

### Database Export
```bash
# Export all collections
mongodump --uri "mongodb://..." --out ./backup

# Restore
mongorestore ./backup
```

---

For additional help, refer to:
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas](https://docs.atlas.mongodb.com)
