# Deployment Guide

This guide covers deploying the BookLeaf Author Support & Communication Portal using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Git
- A Gemini API key (optional, for AI features)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/snehaa1989/BookLeaf-Assignment.git
cd BookLeaf-Assignment
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp backend/.env.example .env
```

Edit the `.env` file and update the following variables:

```env
# Security - CHANGE THESE IN PRODUCTION
JWT_SECRET_KEY=your-secure-random-secret-key-here
ADMIN_PASSWORD=your-secure-admin-password

# Gemini AI (optional - for AI-assisted support)
GEMINI_API_KEY=your-gemini-api-key-here

# CORS (update with your domain in production)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:80
```

### 3. Build and Start the Application

```bash
docker-compose up --build
```

This will:
- Build the frontend and backend Docker images
- Start PostgreSQL database
- Run database migrations
- Start the FastAPI backend on port 8000
- Start the Nginx frontend on port 80

### 4. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 5. Seed the Database

To populate the database with sample authors and books:

```bash
docker-compose exec backend python seed_db.py
```

### 6. Verify the Seed

```bash
docker-compose exec backend python verify_seed.py
```

## Default Credentials

After seeding, you can log in with:

**Admin:**
- Email: `admin@bookleaf.com`
- Password: `Admin@123` (or your configured password)

**Authors:**
- All seeded authors use password: `BookLeaf@123`
- Author emails are in `backend/seed/authors_books.json`

## Production Deployment

### Security Considerations

1. **Change default passwords** in `.env` before deploying
2. **Use a strong JWT secret key** (generate with: `openssl rand -hex 32`)
3. **Configure ALLOWED_ORIGINS** with your actual domain
4. **Use HTTPS** in production (configure reverse proxy or load balancer)
5. **Never commit `.env` file** to version control

### Environment-Specific Configuration

For production, update these variables in `.env`:

```env
# Production database (use managed PostgreSQL if possible)
DATABASE_URL=postgresql://user:password@production-db-host:5432/bookleaf

# Strong secrets
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
ADMIN_PASSWORD=<strong-password>

# Production domain
ALLOWED_ORIGINS=https://your-domain.com

# Gemini API (optional)
GEMINI_API_KEY=your-production-gemini-key
```

### Using Managed PostgreSQL

For production, replace the PostgreSQL service in `docker-compose.yml` with a managed database service (AWS RDS, Google Cloud SQL, etc.) and update the `DATABASE_URL` accordingly.

### SSL/HTTPS Configuration

For production HTTPS:

1. **Option 1: Use a reverse proxy** (Nginx, Traefik, Caddy)
2. **Option 2: Use cloud load balancer** with SSL termination
3. **Option 3: Use Certbot** with Let's Encrypt

Example Nginx reverse proxy configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Docker Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f
```

### Rebuild after changes
```bash
docker-compose up --build
```

### Access backend container
```bash
docker-compose exec backend bash
```

### Run database migrations
```bash
docker-compose exec backend python -c "from app.database import engine; from app import models; from app.database import Base; Base.metadata.create_all(bind=engine)"
```

### Backup PostgreSQL database
```bash
docker-compose exec db pg_dump -U bookleaf bookleaf > backup.sql
```

### Restore PostgreSQL database
```bash
docker-compose exec -T db psql -U bookleaf bookleaf < backup.sql
```

## Troubleshooting

### Database connection issues
- Ensure PostgreSQL is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Verify DATABASE_URL in `.env`

### Frontend not loading
- Check nginx logs: `docker-compose logs frontend`
- Verify backend is running: `docker-compose logs backend`
- Check CORS configuration in `.env`

### AI features not working
- Verify GEMINI_API_KEY is set in `.env`
- Check backend logs for Gemini API errors
- AI features gracefully fallback if API key is missing

### Port conflicts
- Change ports in `docker-compose.yml` if 80 or 8000 are in use
- Update ALLOWED_ORIGINS accordingly

## Scaling

For higher traffic, consider:

1. **Use Kubernetes** instead of Docker Compose
2. **Add Redis** for caching and session management
3. **Use a message queue** (RabbitMQ, Celery) for background tasks
4. **Enable horizontal scaling** with load balancer
5. **Use CDN** for static assets

## Monitoring

Add monitoring for production:

1. **Application monitoring**: Sentry, Datadog, New Relic
2. **Log aggregation**: ELK Stack, Graylog
3. **Database monitoring**: pgAdmin, cloud provider tools
4. **Uptime monitoring**: UptimeRobot, Pingdom

## Backup Strategy

1. **Database backups**: Daily automated backups to cloud storage
2. **Code backups**: Git repository (already on GitHub)
3. **Environment variables**: Store securely (AWS Secrets Manager, etc.)

## Support

For issues or questions:
- Check the logs: `docker-compose logs`
- Review API documentation: http://localhost:8000/docs
- Open an issue on GitHub
