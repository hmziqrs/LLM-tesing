# Pocket Budget Buddy - Deployment Guide

## Overview

This guide covers deploying the Pocket Budget Buddy application to production using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (external or via Docker Compose)
- SSL certificate for HTTPS (production)
- Domain name configured

## Quick Start with Docker Compose

1. **Clone and setup**:
```bash
git clone <repository-url>
cd glm
cp .env.example .env
# Edit .env with your configuration
```

2. **Build and start**:
```bash
docker-compose up -d
```

3. **Initialize database**:
```bash
# Wait for services to be ready, then:
docker-compose exec web bun run db:migrate
docker-compose exec web bun run db:seed  # Optional
```

4. **Access the application**:
- Web App: http://localhost:3000
- API: http://localhost:3000/api
- Health Check: http://localhost:3000/api/health/check

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

#### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: Random string for authentication (32+ chars)
- `SESSION_SECRET`: Random string for sessions (32+ chars)

#### Optional Variables
- `NODE_ENV`: `development` | `production` | `test`
- `PORT`: Application port (default: 3000)
- `CORS_ORIGIN`: Allowed origins for CORS
- `LOG_LEVEL`: Logging level (`debug`, `info`, `warn`, `error`)

### Database Setup

#### Option 1: Use Docker Compose PostgreSQL
Already configured in `docker-compose.yml`.

#### Option 2: External Database
```bash
# Update .env with your database URL
DATABASE_URL=postgresql://user:password@your-db-host:5432/glm-budget
```

Run migrations:
```bash
bun run db:migrate
```

## Production Deployment

### 1. Prepare Environment

```bash
# Clone repository
git clone <repository-url>
cd glm

# Create production environment file
cp .env.production .env
# Edit .env with production values
```

### 2. SSL/HTTPS Setup

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `docker/ssl/`:
   - `cert.pem`: SSL certificate
   - `key.pem`: Private key

3. Uncomment HTTPS section in `docker/nginx.conf`

### 3. Deploy with Docker Compose

```bash
# Build and start production containers
docker-compose -f docker-compose.yml --env-file .env up -d

# Run database migrations
docker-compose exec web bun run db:migrate

# Check health
curl http://localhost/api/health/check
```

### 4. Setup Monitoring

Health endpoints are available:
- `/api/health/check` - Basic health check
- `/api/health/detailed` - Detailed system status
- `/api/health/ready` - Readiness probe
- `/api/health/alive` - Liveness probe

## Scaling

### Horizontal Scaling

For high availability, deploy multiple web instances:

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  web:
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379  # For session storage
```

### Database Scaling

- Use managed PostgreSQL service (AWS RDS, etc.)
- Configure connection pooling
- Add read replicas for heavy read workloads

## Monitoring

### Logs

View application logs:
```bash
docker-compose logs -f web
```

### Metrics

Health checks provide system metrics:
- Memory usage
- CPU load
- Database connectivity
- Response times

### External Monitoring

Configure uptime monitoring:
```bash
# Health check endpoint
curl https://yourdomain.com/api/health/check
```

## Security

### Authentication Security

1. Generate strong secrets:
```bash
# Generate 32-character random strings
openssl rand -base64 32
```

2. Configure secure session settings:
- Use HTTPS in production
- Set appropriate cookie flags
- Implement rate limiting

### Network Security

1. **Firewall**: Only expose necessary ports (80, 443)
2. **SSL/TLS**: Enforce HTTPS in production
3. **Rate Limiting**: Configure in nginx
4. **Database Security**: Use strong passwords, limit access

## Backup and Recovery

### Database Backups

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres glm-budget > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres glm-budget < backup.sql
```

### Automated Backups

Add to `docker-compose.yml`:
```yaml
services:
  postgres-backup:
    image: postgres:15-alpine
    command: |
      sh -c "
      while true; do
        pg_dump -h postgres -U postgres glm-budget > /backup/backup-$$(date +%Y%m%d-%H%M%S).sql
        find /backup -name 'backup-*.sql' -mtime +7 -delete
        sleep 86400
      done"
    volumes:
      - ./backups:/backup
    depends_on:
      - postgres
```

## Troubleshooting

### Common Issues

1. **Database Connection**:
   - Check `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Authentication Issues**:
   - Verify `AUTH_SECRET` is set
   - Check session configuration
   - Clear browser cookies

3. **Performance Issues**:
   - Check resource usage (`docker stats`)
   - Review application logs
   - Monitor database performance

### Debug Commands

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f web
docker-compose logs -f postgres

# Access container shell
docker-compose exec web sh

# Database connection test
docker-compose exec web bun run db:studio
```

## Maintenance

### Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run migrations if needed
docker-compose exec web bun run db:migrate
```

### Cleanup

```bash
# Remove unused images
docker image prune -f

# Remove unused volumes (caution!)
docker volume prune -f
```

## Support

For deployment issues:
1. Check logs for error messages
2. Verify environment configuration
3. Test database connectivity
4. Review this documentation
5. Check GitHub issues for common solutions