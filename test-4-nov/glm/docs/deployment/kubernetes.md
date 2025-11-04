# Kubernetes Deployment Guide

This guide covers deploying Pocket Budget Buddy to Kubernetes clusters.

## Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured
- Ingress controller (nginx-ingress recommended)
- Cert-Manager for SSL certificates
- PersistentVolume for PostgreSQL

## Kubernetes Manifests

### 1. Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: glm-budget
```

### 2. ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: glm-config
  namespace: glm-budget
data:
  NODE_ENV: "production"
  PORT: "3000"
  HOSTNAME: "0.0.0.0"
  LOG_LEVEL: "info"
  CORS_ORIGIN: "https://yourdomain.com"
  ORPC_URL: "https://yourdomain.com/api"
  HEALTH_CHECK_ENABLED: "true"
```

### 3. Secret

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: glm-secrets
  namespace: glm-budget
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  AUTH_SECRET: <base64-encoded-auth-secret>
  SESSION_SECRET: <base64-encoded-session-secret>
```

### 4. PostgreSQL Deployment

```yaml
# postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: glm-budget
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: glm-budget
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: glm-secrets
              key: POSTGRES_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: glm-budget
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: glm-budget
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### 5. Application Deployment

```yaml
# app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: glm-budget-app
  namespace: glm-budget
spec:
  replicas: 3
  selector:
    matchLabels:
      app: glm-budget-app
  template:
    metadata:
      labels:
        app: glm-budget-app
    spec:
      containers:
      - name: glm-budget
        image: your-registry/glm-budget:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: glm-config
        - secretRef:
            name: glm-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health/alive
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: glm-budget-service
  namespace: glm-budget
spec:
  selector:
    app: glm-budget-app
  ports:
  - port: 80
    targetPort: 3000
```

### 6. Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: glm-budget-ingress
  namespace: glm-budget
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: glm-budget-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: glm-budget-service
            port:
              number: 80
```

### 7. Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: glm-budget-hpa
  namespace: glm-budget
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: glm-budget-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Deployment Steps

### 1. Apply Manifests

```bash
# Apply all manifests
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f postgres.yaml
kubectl apply -f app.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml
```

### 2. Wait for Deployment

```bash
# Check deployment status
kubectl get pods -n glm-budget

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod -l app=glm-budget-app -n glm-budget --timeout=300s
```

### 3. Run Database Migrations

```bash
# Port forward to access the application
kubectl port-forward service/glm-budget-service 3000:80 -n glm-budget

# Run migrations in a temporary pod
kubectl run migration --rm -i --restart=Never \
  --image=your-registry/glm-budget:latest \
  --env-from=configmap/glm-config \
  --env-from=secret/glm-secrets \
  -n glm-budget \
  -- bun run db:migrate
```

### 4. Verify Deployment

```bash
# Check health status
kubectl get ingress glm-budget-ingress -n glm-budget

# Test health endpoint
curl https://yourdomain.com/api/health/check
```

## Monitoring

### 1. Prometheus Metrics

Add metrics endpoint to application and configure Prometheus:

```yaml
# service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: glm-budget-monitor
  namespace: glm-budget
spec:
  selector:
    matchLabels:
      app: glm-budget-app
  endpoints:
  - port: metrics
    path: /metrics
```

### 2. Logs

```bash
# View application logs
kubectl logs -f deployment/glm-budget-app -n glm-budget

# View logs from all pods
kubectl logs -f -l app=glm-budget-app -n glm-budget
```

### 3. Health Checks

Health endpoints are available:
- `/api/health/check` - Basic health
- `/api/health/detailed` - Detailed metrics
- `/api/health/ready` - Readiness probe
- `/api/health/alive` - Liveness probe

## Scaling

### Manual Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment glm-budget-app --replicas=5 -n glm-budget
```

### Auto Scaling

The HPA will automatically scale based on CPU and memory usage. Check status:

```bash
kubectl get hpa glm-budget-hpa -n glm-budget
```

## Updates

### Rolling Updates

```bash
# Update to new version
kubectl set image deployment/glm-budget-app glm-budget=your-registry/glm-budget:v2 -n glm-budget

# Check rollout status
kubectl rollout status deployment/glm-budget-app -n glm-budget
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/glm-budget-app -n glm-budget
```

## Security

### 1. Network Policies

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: glm-budget-netpol
  namespace: glm-budget
spec:
  podSelector:
    matchLabels:
      app: glm-budget-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

### 2. Pod Security Policies

Configure appropriate pod security contexts and policies for production use.

## Backup

### Database Backup

```bash
# Create backup job
kubectl create job --from=cronjob/postgres-backup backup-$(date +%Y%m%d) -n glm-budget
```

### Disaster Recovery

Store backups in external storage and document recovery procedures.