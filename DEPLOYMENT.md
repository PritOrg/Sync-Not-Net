# Deployment Guide for Sync-Not-Net

## Prerequisites

1. Docker and Docker Compose installed
2. AWS CLI configured with appropriate credentials
3. MongoDB 6.0+ for production database
4. Redis 7.0+ for session management and caching
5. Node.js 20.x LTS for development

## Environment Variables

Create a `.env` file in both `api/` and `pro/` directories. See `.env.example` for required variables.

### API Environment Variables
```
NODE_ENV=production
MONGODB_URI=mongodb://your-mongodb-uri
REDIS_URL=redis://your-redis-uri
JWT_SECRET=your-strong-secret-key
CORS_ORIGIN=https://your-frontend-domain
PORT=3001
SOCKET_MAX_CONNECTIONS_PER_IP=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables
```
REACT_APP_API_URL=https://your-api-domain
```

## Local Development Setup

1. Install dependencies:
   ```bash
   # Install API dependencies
   cd api
   npm install

   # Install Frontend dependencies
   cd ../pro
   npm install
   ```

2. Start development servers:
   ```bash
   # Start API in development mode
   cd api
   npm run dev

   # Start Frontend in development mode (in another terminal)
   cd pro
   npm start
   ```

## Production Deployment Options

### 1. Docker Compose (Single Server)

1. Build and start services:
   ```bash
   docker-compose up -d --build
   ```

2. Monitor logs:
   ```bash
   docker-compose logs -f
   ```

### 2. AWS ECS Deployment

1. Create ECR repositories:
   ```bash
   aws ecr create-repository --repository-name sync-not-net-api
   aws ecr create-repository --repository-name sync-not-net-frontend
   ```

2. Push images (automated via GitHub Actions):
   - Configure GitHub repository secrets:
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY
     - AWS_REGION
     - JWT_SECRET

3. ECS Setup:
   - Create ECS cluster
   - Configure task definitions for API and Frontend
   - Set up ECS services with load balancers
   - Configure auto-scaling rules

### 3. Kubernetes Deployment

Kubernetes manifests are available in the `k8s/` directory:

1. Apply configurations:
   ```bash
   kubectl apply -f k8s/namespace.yml
   kubectl apply -f k8s/secrets.yml
   kubectl apply -f k8s/configmap.yml
   kubectl apply -f k8s/mongodb.yml
   kubectl apply -f k8s/redis.yml
   kubectl apply -f k8s/api.yml
   kubectl apply -f k8s/frontend.yml
   ```

## Monitoring and Maintenance

1. Health Checks:
   - API: `http://your-api-domain/health`
   - Frontend: `http://your-frontend-domain/health`

2. Logs:
   - API logs are in `api/logs/`
   - Use `docker-compose logs` for containerized deployment
   - Configure Sentry for error tracking

3. Backup:
   - MongoDB backup script in `scripts/backup-mongodb.sh`
   - Configure automated backups in production

## Security Considerations

1. SSL/TLS:
   - Configure SSL certificates
   - Use Let's Encrypt for automated certificate management

2. Firewall Rules:
   - Restrict access to MongoDB and Redis
   - Configure security groups in AWS

3. Updates:
   - Regular security updates for dependencies
   - Monitor GitHub security alerts

## Scaling Considerations

1. Database:
   - Configure MongoDB replica set
   - Consider sharding for large datasets

2. Caching:
   - Redis cluster for distributed caching
   - Configure connection pooling

3. Application:
   - Horizontal scaling with load balancer
   - Configure session affinity for WebSocket connections

## Troubleshooting

Common issues and solutions:

1. Connection Issues:
   - Check firewall rules
   - Verify environment variables
   - Check DNS configuration

2. Performance Issues:
   - Monitor MongoDB queries
   - Check Redis memory usage
   - Review application logs

3. Deployment Issues:
   - Verify Docker builds
   - Check GitHub Actions logs
   - Validate AWS credentials