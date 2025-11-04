#!/bin/sh

# Start script for Pocket Budget Buddy production deployment

echo "🚀 Starting Pocket Budget Buddy..."

# Database migrations
echo "📊 Running database migrations..."
bun run db:migrate || echo "⚠️  Migration failed or already applied"

# Start the application (web server with built-in API)
echo "🌐 Starting web server..."
exec bun run serve