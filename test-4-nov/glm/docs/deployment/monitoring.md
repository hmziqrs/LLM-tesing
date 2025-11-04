# Monitoring and Observability

This guide covers monitoring, logging, and observability for the Pocket Budget Buddy application.

## Health Endpoints

The application provides several health check endpoints:

### `/api/health/check`
Basic health check that returns application status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "service": "glm-api"
}
```

### `/api/health/detailed`
Comprehensive health check including system dependencies.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "service": "glm-api",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "memory": {
      "status": "healthy",
      "utilization": "45.25%",
      "used": "128.50MB",
      "total": "256.00MB"
    },
    "cpu": {
      "status": "healthy",
      "load1m": "0.75",
      "load5m": "0.82",
      "load15m": "0.90"
    }
  }
}
```

### `/api/health/ready`
Readiness probe for Kubernetes/container orchestration.

### `/api/health/alive`
Liveness probe for Kubernetes/container orchestration.

## Logging

### Structured Logging with Pino

The application uses Pino for structured logging in JSON format.

#### Log Levels
- `debug`: Detailed debugging information
- `info`: General information about application flow
- `warn`: Warning messages for potentially problematic situations
- `error`: Error messages for failures

#### Log Format
```json
{
  "level": "info",
  "time": "2024-01-01T12:00:00.000Z",
  "pid": 1234,
  "hostname": "app-server-1",
  "service": "glm-api",
  "version": "1.0.0",
  "requestId": "req_abc123",
  "userId": "user_456",
  "method": "POST",
  "path": "/api/accounts",
  "status": 200,
  "duration": 45,
  "msg": "POST /api/accounts - 200 (45ms)"
}
```

### Log Types

#### Request Logging
Every HTTP request is logged with:
- Request ID (for tracing)
- User ID (if authenticated)
- HTTP method and path
- Response status and duration
- User agent and IP

#### Security Events
Security-related events are logged separately:
- Authentication attempts
- Rate limiting
- Suspicious activities

#### Performance Logging
Slow operations are logged:
- Database queries (>1000ms)
- API calls (>1000ms)
- File operations

#### Error Logging
All errors are logged with full context:
- Error message and stack trace
- Request context
- User information (if available)

### Log Aggregation

#### Docker Environment
```bash
# View logs
docker-compose logs -f web

# Filter by level
docker-compose logs web | grep ERROR

# Export logs
docker-compose logs --no-color web > app.log
```

#### Production Log Collection
Set up log aggregation with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Fluentd/Fluent Bit**
- **AWS CloudWatch**
- **Google Cloud Logging**

#### Log Rotation
Configure log rotation in production:

```bash
# Docker logging configuration
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## Metrics and Monitoring

### Application Metrics

#### Performance Metrics
- Response time distribution
- Request rate per endpoint
- Error rate
- Active user sessions

#### System Metrics
- Memory usage
- CPU utilization
- Database connection pool status
- File system usage

#### Business Metrics
- User registrations
- Transaction volume
- Budget utilization
- Goal completion rates

### Monitoring Tools

#### Prometheus + Grafana
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'glm-budget'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

#### Health Check Monitoring
Monitor health endpoints with:
- **Uptime Kuma** (self-hosted)
- **Pingdom**
- **StatusCake**
- **AWS CloudWatch Alarms**

### Alerting

#### Critical Alerts
- Application health check failures
- Database connectivity issues
- High error rates (>5%)
- Memory usage >90%

#### Warning Alerts
- High response times (>2s)
- CPU usage >80%
- Disk space >80%

## Distributed Tracing

### Request ID Tracking
Each request gets a unique ID for tracing:

```javascript
const requestId = uuidv4();
const logger = createRequestLogger(requestId, userId);
```

### Transaction Tracing
Track operations across services:
- User authentication
- Database transactions
- External API calls
- File uploads

## Performance Monitoring

### Response Time Monitoring

#### Database Performance
Monitor query performance:
```javascript
const startTime = Date.now();
await db.query(...);
const duration = Date.now() - startTime;

if (duration > 1000) {
  logPerformance('database_query', duration, { table, operation });
}
```

#### API Performance
Track endpoint performance:
- Average response time
- 95th percentile response time
- Request throughput

### Resource Monitoring

#### Memory Usage
```javascript
const memUsage = process.memoryUsage();
logger.debug({
  heapUsed: memUsage.heapUsed,
  heapTotal: memUsage.heapTotal,
  external: memUsage.external,
  rss: memUsage.rss
}, 'Memory usage');
```

#### CPU Usage
Monitor CPU-intensive operations and implement throttling if needed.

## Security Monitoring

### Authentication Events
```javascript
logSecurityEvent('login_attempt', userId, {
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  success: true
});
```

### Rate Limiting
Monitor rate limit violations:
```javascript
if (rateLimitExceeded) {
  logSecurityEvent('rate_limit_exceeded', userId, {
    endpoint: req.path,
    ip: req.ip
  });
}
```

### Suspicious Activities
Monitor for:
- Failed login attempts
- Unusual transaction patterns
- Permission escalation attempts

## Debugging Tools

### Debug Endpoints
Configure debug endpoints (development only):
- `/debug/health` - Detailed health info
- `/debug/config` - Current configuration
- `/debug/stats` - Application statistics

### Profiling
Use Node.js profiling:
```bash
# CPU profiling
node --prof app.js

# Memory profiling
node --inspect app.js
```

## Documentation

### Runbooks
Create runbooks for common scenarios:
- Database connectivity issues
- High memory usage
- Authentication failures
- Performance degradation

### Monitoring Dashboard
Set up Grafana dashboards for:
- Application health
- System metrics
- Business metrics
- Error rates

## Best Practices

### Logging
1. **Log everything**: Log all requests and errors
2. **Structured format**: Use JSON for easy parsing
3. **Correlation IDs**: Track requests across services
4. **Log levels**: Use appropriate log levels
5. **Sensitive data**: Never log passwords or secrets

### Monitoring
1. **Health checks**: Implement comprehensive health checks
2. **Alerting**: Set up appropriate alerting thresholds
3. **Dashboards**: Create visual monitoring dashboards
4. **Testing**: Regularly test monitoring systems

### Performance
1. **Metrics**: Track key performance indicators
2. **Profiling**: Regularly profile application performance
3. **Optimization**: Use monitoring data for optimization
4. **Capacity planning**: Plan for scaling based on metrics