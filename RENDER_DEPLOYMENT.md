# Render Deployment Guide

This guide covers deploying the BookLeaf Author Support Portal to Render.

## Prerequisites

- A Render account (free tier available)
- GitHub repository with the code
- Gemini API key (optional, for AI features)

## Deployment Steps

### 1. Push Code to GitHub

Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Deploy via Render Dashboard

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository
5. Click **"Existing Dockerfile"**
6. Configure the service:

#### Backend Service
- **Name**: bookleaf-backend
- **Region**: Oregon (or closest to you)
- **Branch**: main
- **Dockerfile path**: ./backend/Dockerfile
- **Docker Context**: . (root directory)
- **Plan**: Free
- **Environment Variables**:
  - `DATABASE_URL`: Will be set automatically after creating database
  - `JWT_SECRET_KEY`: Generate with `openssl rand -hex 32`
  - `JWT_ALGORITHM`: HS256
  - `ACCESS_TOKEN_EXPIRE_MINUTES`: 60
  - `ADMIN_EMAIL`: admin@bookleaf.com
  - `ADMIN_PASSWORD`: Set a strong password
  - `SEEDED_AUTHOR_PASSWORD`: Set a strong password
  - `GEMINI_API_KEY`: Your Gemini API key (optional)
  - `ALLOWED_ORIGINS`: https://bookleaf-frontend.onrender.com

#### Frontend Service
- **Name**: bookleaf-frontend
- **Region**: Same as backend
- **Branch**: main
- **Dockerfile path**: ./frontend/Dockerfile
- **Docker Context**: . (root directory)
- **Plan**: Free
- **Environment Variables**:
  - `VITE_API_URL`: https://bookleaf-backend.onrender.com

### 3. Create PostgreSQL Database

1. Go to **"New +"** → **"PostgreSQL"**
2. **Name**: bookleaf-db
3. **Database**: bookleaf
4. **User**: bookleaf
5. **Region**: Same as backend
6. **Plan**: Free
7. Click **"Create Database"**

### 4. Update Backend DATABASE_URL

After creating the database:
1. Go to your backend service in Render
2. Click **"Environment"** tab
3. Find `DATABASE_URL` variable
4. Click **"Connect"** to get the connection string from the database
5. Update the value with the database connection string

### 5. Deploy

1. Click **"Deploy"** on the backend service
2. Wait for deployment to complete
3. Click **"Deploy"** on the frontend service
4. Wait for deployment to complete

### 6. Seed the Database

After deployment, you'll need to seed the database:

1. Go to the backend service in Render
2. Click **"SSH"** tab
3. Click **"Connect"** to open a shell
4. Run:
```bash
python seed_db.py
```

### 7. Access Your Application

- **Frontend**: https://bookleaf-frontend.onrender.com
- **Backend API**: https://bookleaf-backend.onrender.com
- **API Docs**: https://bookleaf-backend.onrender.com/docs

### 8. Update CORS

After deployment, update the `ALLOWED_ORIGINS` in backend environment variables to include your actual frontend URL.

## Alternative: Deploy via render.yaml

You can also deploy using the `render.yaml` file:

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository
5. Click **"Apply"**

This will automatically create all services based on the `render.yaml` configuration.

## Post-Deployment Configuration

### Update CORS Origins

1. Go to backend service → **"Environment"** tab
2. Update `ALLOWED_ORIGINS` to: `https://bookleaf-frontend.onrender.com`
3. Click **"Save Changes"**
4. The backend will automatically redeploy

### Set Gemini API Key (Optional)

1. Go to backend service → **"Environment"** tab
2. Add `GEMINI_API_KEY` with your Gemini API key
3. Click **"Save Changes"**
4. The backend will automatically redeploy

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly set
- Check that database and backend are in the same region
- Verify database is running

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check the exact URL (include https://)

### Build Failures
- Check Render logs for specific errors
- Ensure Dockerfile paths are correct
- Verify all dependencies are in requirements.txt

### Frontend Not Connecting to Backend
- Ensure `VITE_API_URL` is set correctly
- Check that backend is deployed and running
- Verify CORS configuration

## Monitoring

- **Logs**: View logs in Render dashboard for each service
- **Metrics**: Render provides basic metrics for free tier
- **Health Checks**: Backend has `/health` endpoint

## Scaling

For production scaling:
- Upgrade to paid plans for more resources
- Add multiple instances for high availability
- Use Render's autoscaling features
- Consider using managed PostgreSQL with higher specs

## Cost

**Free Tier** (current setup):
- PostgreSQL: $0/month (90 days free, then $7/month)
- Web Services: $0/month (750 hours/month)
- Total: $0/month initially

**Paid Tier** (if needed):
- PostgreSQL: $7/month
- Web Services: $7/month per instance
- Total: ~$21/month minimum for production

## Security Notes

1. **Change default passwords** before production use
2. **Use strong JWT_SECRET_KEY** (generate with openssl)
3. **Never commit .env file** to git
4. **Use HTTPS** (Render provides this automatically)
5. **Enable Render's DDoS protection**
6. **Regular backups** are included with Render PostgreSQL
