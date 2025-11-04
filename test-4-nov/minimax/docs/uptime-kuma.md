# Uptime Kuma Monitoring Notes

## Overview
The Uptime Kuma README describes the project as “an easy-to-use self-hosted monitoring tool” with features like monitoring HTTP(s), TCP, DNS, keyword checks, Docker containers, a “fancy, reactive, fast UI/UX,” support for 90+ notification services, multiple status pages, certificate info, and two-factor auth ([Uptime Kuma README, retrieved 2024‑11‑04](https://raw.githubusercontent.com/louislam/uptime-kuma/master/README.md)).

## Why We Use It
- Easy to deploy alongside our stack via Docker Compose.
- Supports health-check intervals, incident notifications, and status pages without SaaS dependencies.
- Provides historical uptime graphs useful for SLO reviews.

## Integration Checklist
1. Include an Uptime Kuma service in `docker-compose.yml` for local experimentation.
2. Expose `/healthz` (liveness) and `/readyz` (readiness) endpoints in both services; document expected responses.
3. Configure monitors in production to alert via email/Slack/webhook.
4. Set maintenance windows before deployments to avoid false positives.

## Helpful Commands
- `docker compose up uptime-kuma -d` – Start the monitoring service locally.
- Use `http://localhost:5561` (default) to access the dashboard and add monitors.

## Docs & References
- README: https://raw.githubusercontent.com/louislam/uptime-kuma/master/README.md
- Project repo: https://github.com/louislam/uptime-kuma
- Health check best practices: https://12factor.net/disposability

*No live fetching possible here; consult the official repo for the freshest instructions when online.*
