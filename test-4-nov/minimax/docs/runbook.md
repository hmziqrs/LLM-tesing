# Operations Runbook

This document provides procedures for handling common operational tasks and incidents.

## Deployment Procedures

### Initial Deployment

1. **Provision Infrastructure**
   ```bash
   # Create PostgreSQL instance
   # Set up domain names
   # Configure SSL certificates
   ```

2. **Deploy Database**
   ```bash
   docker compose -f docker-compose.prod.yml up -d postgres
   ```

3. **Run Migrations**
   ```bash
   docker compose exec postgres psql -U postgres -d pocket_budget_buddy -f /docker-entrypoint-initdb.d/0000_medical_jackpot.sql
   ```

4. **Deploy Services**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### Rolling Updates

1. **Update Code**
   ```bash
   git pull origin main
   docker compose -f docker-compose.prod.yml build
   docker compose -f docker-compose.prod.yml up -d --no-deps web api
   ```

2. **Verify Health**
   ```bash
   curl https://yourdomain.com/healthz
   curl https://api.yourdomain.com/healthz
   ```

### Database Migrations

1. **Generate Migration**
   ```bash
   bun run db:generate
   ```

2. **Apply Migration**
   ```bash
   docker compose exec api bun run db:migrate
   ```

3. **Verify Migration**
   ```bash
   docker compose exec postgres psql -U postgres -d pocket_budget_buddy -c "\dt"
   ```

## Incident Response

### High CPU Usage

**Symptoms:**
- Slow API responses
- High load average
- Uptime Kuma alerts

**Diagnosis:**
```bash
docker stats
curl https://api.yourdomain.com/metrics
```

**Resolution:**
1. Check for infinite loops in logs
2. Scale up resources
3. Optimize queries

### Database Connection Issues

**Symptoms:**
- API returning 500 errors
- "connection refused" messages
- Timeouts

**Diagnosis:**
```bash
docker compose logs postgres
pg_isready -h postgres -p 5432
```

**Resolution:**
1. Restart postgres service
2. Check connection pool settings
3. Verify DATABASE_URL

### High Memory Usage

**Symptoms:**
- Out of memory errors
- Processes crashing
- Slow performance

**Diagnosis:**
```bash
docker stats --no-stream
curl https://api.yourdomain.com/metrics
```

**Resolution:**
1. Identify memory leaks
2. Increase container memory limits
3. Restart affected services

## Backup and Recovery

### Create Manual Backup

```bash
pg_dump -h localhost -U postgres pocket_budget_buddy > backup-$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
psql -h localhost -U postgres pocket_budget_buddy < backup-20240101.sql
```

### Seed Database with Demo Data

```bash
docker compose exec api bun run db:seed
```

## Monitoring

### Uptime Kuma Monitors

Configure monitors for:

1. **Web App**
   - URL: `https://yourdomain.com/healthz`
   - Interval: 60s
   - Retry: 3

2. **API**
   - URL: `https://api.yourdomain.com/healthz`
   - Interval: 60s
   - Retry: 3

### Log Aggregation

Configure log shipping to your preferred service:

- **Datadog**: Enable Docker log collection
- **CloudWatch**: Use awslogs driver
- **Logtail**: Configure logtail collector

### Metrics

Monitor these key metrics:

- Response time (p95, p99)
- Error rate
- Database connections
- Memory usage
- CPU usage
- Disk space

## Security

### Certificate Management

**Check Expiry:**
```bash
openssl x509 -in /path/to/cert.pem -text -noout | grep "Not After"
```

**Renew Let's Encrypt:**
```bash
certbot renew
```

### Rotate Secrets

1. Generate new secrets
2. Update environment variables
3. Restart services
4. Remove old secrets

### Database Access

**Connect to Production DB:**
```bash
psql $DATABASE_URL
```

**List Users:**
```sql
SELECT username, created_at FROM auth.users;
```

## Performance Tuning

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX CONCURRENTLY idx_transactions_account ON transactions(account_id);
```

### API Performance

1. Enable connection pooling
2. Add Redis cache
3. Implement query caching
4. Optimize database queries

## Common Commands

### Docker Compose

```bash
# View logs
docker compose logs -f [service]

# Scale service
docker compose up -d --scale api=3

# Restart service
docker compose restart [service]

# Remove volumes
docker compose down -v
```

### Database

```bash
# Connect to database
docker compose exec postgres psql -U postgres -d pocket_budget_buddy

# View tables
\dt

# View table schema
\d table_name

# Run query
SELECT COUNT(*) FROM transactions;
```

### Application

```bash
# View application logs
docker compose logs -f api

# Run database commands
docker compose exec api bun run db:studio

# Generate new migration
docker compose exec api bun run db:generate
```

## Escalation

### Severity Levels

**P0 - Critical**
- Service completely down
- Data loss
- Security breach

**Response:** Immediately page on-call team

**P1 - High**
- Degraded performance
- Partial feature outage
- Monitoring failures

**Response:** Investigate within 15 minutes

**P2 - Medium**
- Minor feature issues
- Slow performance
- Cosmetic bugs

**Response:** Investigate within 1 hour

**P3 - Low**
- Documentation updates
- Feature requests
- Non-urgent improvements

**Response:** Schedule for next sprint

### Contact Information

- **On-call Engineer**: [Contact]
- **Engineering Manager**: [Contact]
- **CTO**: [Contact]

### Useful Links

- **Dashboard**: [Link]
- **GitHub**: [Link]
- **Monitoring**: [Link]
- **Documentation**: [Link]
