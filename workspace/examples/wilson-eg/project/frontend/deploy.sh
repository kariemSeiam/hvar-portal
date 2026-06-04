#!/bin/bash

# Wilson Egypt - Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying Wilson Egypt to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose not found, trying 'docker compose'..."
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Build frontend
print_status "Building frontend..."
npm run build

# Build Docker images
print_status "Building Docker images..."
case $ENVIRONMENT in
    production)
        $COMPOSE_CMD -f docker-compose.yml build --no-cache
        ;;
    staging)
        $COMPOSE_CMD -f docker-compose.yml -f docker-compose.staging.yml build
        ;;
    *)
        $COMPOSE_CMD -f docker-compose.yml build
        ;;
esac

# Start containers
print_status "Starting containers..."
$COMPOSE_CMD up -d

# Wait for health check
print_status "Waiting for services to be healthy..."
sleep 10

# Check if services are running
if $COMPOSE_CMD ps | grep -q "Up"; then
    print_status "Deployment successful!"
    print_status "Frontend: http://localhost:3001"
    print_status "Backend API: http://localhost:5000"
else
    print_error "Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi

# Show logs
echo ""
echo "📋 Recent logs:"
$COMPOSE_CMD logs --tail=20

echo ""
print_status "🎉 Wilson Egypt is now running!"
