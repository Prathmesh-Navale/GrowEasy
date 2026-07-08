# GrowEasy CSV Importer - Deployment Guide

## Production Checklist

### 1. Environment Setup
```bash
# Create production .env
DATABASE_URL=postgresql://user:password@prod-db-host:5432/groweasy
PORT=4000
OPENAI_API_KEY=sk-your-actual-key
AI_MODEL=gpt-4o-mini  # or gpt-4o for higher accuracy
BATCH_SIZE=20
NODE_ENV=production
```

### 2. Database Preparation

**Create PostgreSQL database:**
```bash
psql -U postgres
CREATE DATABASE groweasy;
```

**Run migrations:**
```bash
npm exec prisma migrate deploy
```

**Verify schema:**
```bash
npm exec prisma db seed  # if you have seed scripts
```

### 3. Build Production Bundle

```bash
# Build both frontend and backend
npm run build

# Verify builds
ls backend/dist/
ls frontend/.next/
```

### 4. Start Services

**Backend:**
```bash
cd backend
npm run start
```

**Frontend (Next.js production):**
```bash
cd frontend
npm run start
```

Or use **PM2** for process management:
```bash
npm install -g pm2

# Start backend
pm2 start backend/dist/server.js --name groweasy-backend

# Start frontend
pm2 start frontend/npm run start --name groweasy-frontend

# Monitor
pm2 monit
```

### 5. Reverse Proxy (Nginx)

```nginx
upstream backend {
    server localhost:4000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload limits
        client_max_body_size 5M;
    }
}
```

### 6. Docker Deployment

**Create backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/dist ./dist
COPY backend/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

**Create frontend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

**Docker Compose (production):**
```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: groweasy
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    build: ./backend
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/groweasy
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      PORT: 4000
      NODE_ENV: production
    ports:
      - "4000:4000"
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: https://your-domain.com/api
    restart: always

volumes:
  postgres_data:
```

### 7. Monitoring & Logging

**Application Logs:**
```bash
# Check PM2 logs
pm2 logs groweasy-backend
pm2 logs groweasy-frontend

# Docker logs
docker logs groweasy-backend-1
docker logs groweasy-frontend-1
```

**Database Monitoring:**
```bash
# Connect to prod database
psql -U $DB_USER -h $DB_HOST groweasy

# Check import job status
SELECT id, fileName, status, totalRows, totalImported, totalSkipped FROM import_jobs ORDER BY createdAt DESC LIMIT 10;

# Check error patterns
SELECT reason, COUNT(*) as count FROM skipped_records GROUP BY reason;
```

### 8. Backup Strategy

**Daily PostgreSQL backup:**
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/groweasy"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/groweasy > $BACKUP_DIR/backup_$DATE.sql

# Keep last 30 days only
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

### 9. Security Hardening

- ✅ Use HTTPS only (SSL certificate)
- ✅ Set `NODE_ENV=production`
- ✅ Use strong database passwords
- ✅ Restrict OpenAI API key permissions
- ✅ Enable database backups
- ✅ Set up database read replicas for load balancing
- ✅ Rate limit API endpoints
- ✅ Enable CORS only for trusted domains

**Environment Variables Best Practices:**
```bash
# DO NOT commit .env
echo ".env" >> .gitignore

# Use secure secret management (AWS Secrets Manager, HashiCorp Vault, etc.)
# For small deployments, use environment variable files:
source /secure/location/.env.prod
```

### 10. Performance Optimization

**Database Indexing:**
```sql
-- Index import jobs by status
CREATE INDEX idx_import_jobs_status ON import_jobs(status);

-- Index crm leads by import job
CREATE INDEX idx_crm_leads_importjob ON crm_leads(importJobId);

-- Index for fast lookups
CREATE INDEX idx_import_raw_rows_job ON import_raw_rows(importJobId);
```

**Batch Processing Tuning:**
```env
# For faster processing, increase batch size
BATCH_SIZE=50  # Process 50 rows per AI call

# But watch OpenAI rate limits
# Default: 100 requests/min, 2M tokens/day
```

### 11. Monitoring Dashboard

Use tools like:
- **Prometheus + Grafana** for metrics
- **ELK Stack** for logs
- **NewRelic** or **DataDog** for APM

**Basic health check:**
```bash
curl https://your-domain.com/health
```

---

## Troubleshooting

### Issue: Slow Imports
**Solution:** Increase `BATCH_SIZE`, add database indexes, consider async processing queue

### Issue: OpenAI Rate Limits
**Solution:** Reduce `BATCH_SIZE`, implement exponential backoff, use queue system

### Issue: Large File Uploads Failing
**Solution:** Increase `client_max_body_size` in Nginx, adjust multer limits in backend

### Issue: Database Connection Pool Exhaustion
**Solution:** Increase pool size in Prisma config, monitor active connections

---

## Monitoring Commands

```bash
# Check service status
pm2 status

# Memory usage
pm2 monit

# Application logs
tail -f /var/log/groweasy/backend.log
tail -f /var/log/groweasy/frontend.log

# Database connections
psql -U postgres -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Disk usage
df -h /var/lib/postgresql/data
```

---

## Rollback Plan

```bash
# Keep previous version in /app-v1, /app-v2
# If deployment fails:

pm2 delete groweasy-backend
cd /app-v1/backend
npm run start &

# Or using Docker:
docker stop groweasy-backend-1
docker run -d --name groweasy-backend -p 4000:4000 groweasy-backend:v1
```
