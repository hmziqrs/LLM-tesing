# Environment Configuration

This document describes the environment variables and configuration needed for different deployment environments.

## Local Development

### Required Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### Development Services

Start all services with Docker Compose:

```bash
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- Uptime Kuma on port 3001
- Web app on port 3000 (after bun run dev)
- API on port 3001 (after bun run dev)

## Staging Environment

### Database

Use a managed PostgreSQL instance (e.g., Railway, Supabase, or AWS RDS).

### Environment Variables

```env
NODE_ENV=staging
DATABASE_URL=postgresql://user:password@host:5432/dbname
BETTER_AUTH_SECRET=your-secret-key
API_URL=https://api-staging.yourdomain.com
WEB_URL=https://staging.yourdomain.com
```

### Deployment

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Production Environment

### Database

Use a production-grade managed PostgreSQL with:
- Point-in-time recovery enabled
- Automated backups
- Connection pooling

### Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname
BETTER_AUTH_SECRET=your-production-secret-key
API_URL=https://api.yourdomain.com
WEB_URL=https://yourdomain.com
```

### SSL/TLS

Ensure HTTPS is enabled for production.

### Deployment

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Health Checks

### API Health Checks

- `GET /healthz` - Basic health check
- `GET /readyz` - Readiness probe
- `GET /metrics` - Application metrics

### Web Health Checks

- `GET /healthz` - Basic health check

## Monitoring

### Uptime Kuma

Configure monitors for:
- API health endpoint: `https://api.yourdomain.com/healthz`
- Web health endpoint: `https://yourdomain.com/healthz`

### Logs

Logs are output to stdout/stderr in JSON format.

For production, configure log aggregation:
- Datadog
- New Relic
- CloudWatch
- Logtail

## Backup Strategy

### Database Backups

Daily automated backups with point-in-time recovery:

```bash
pg_dump -h host -U user dbname > backup.sql
```

### Restoration

```bash
psql -h host -U user -d dbname < backup.sql
```

## Troubleshooting

### Common Issues

1. **Database connection refused**
   - Check DATABASE_URL is correct
   - Verify database is running and accessible

2. **Port already in use**
   - Stop conflicting services
   - Change port mappings in docker-compose

3. **Build failures**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild images

### Log Inspection

View logs:

```bash
docker compose logs web
docker compose logs api
docker compose logs postgres
```

Follow logs:

```bash
docker compose logs -f web
```
