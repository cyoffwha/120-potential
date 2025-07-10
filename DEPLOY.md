# Deployment Guide for 120% Potential

This guide provides clear, production-ready deployment instructions for both the backend (FastAPI) and frontend (Vite + React) of the 120% Potential project. It assumes you are deploying on a Linux server with root or sudo access.

---

## 1. Prerequisites

- **Backend:**
  - Python 3.8+
  - PostgreSQL database (default: user `postgres`, password `postgres`, db `potential`)
  - OpenAI API key (and optionally Gemini API key)
- **Frontend:**
  - Node.js (v18+ recommended) and npm
- **General:**
  - git, curl, and a production web server (e.g., nginx) for serving static files and reverse proxy

---

## 2. Backend Deployment (FastAPI)

### a. Clone and Setup
```bash
cd /opt
sudo git clone <YOUR_REPO_URL> 120-potential
cd 120-potential/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### b. Environment Variables
Create a `.env` file in `backend/`:
```
OPENAI_API_KEY="your_openai_api_key"
GEMINI_API_KEY="your_gemini_api_key"  # optional
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/potential
```

### c. Database Setup
Ensure PostgreSQL is running and accessible. Then initialize the database:
```bash
python setup_db.py
```

### d. Run with Production ASGI Server
Use `gunicorn` with `uvicorn` workers for production:
```bash
pip install gunicorn uvicorn
cd /opt/120-potential/backend
source venv/bin/activate
gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8079 --workers 2
```
- For persistent deployment, use a process manager like `systemd` or `supervisor`.

---

## 3. Frontend Deployment (Vite + React)

### a. Build Static Files
```bash
cd /opt/120-potential/frontend
npm install
npm run build
```
This generates a `dist/` folder with static assets.

### b. Serve Static Files
- **Option 1: Nginx (recommended)**
  - Configure nginx to serve `/opt/120-potential/frontend/dist` at your domain or subdomain.
  - Example nginx config:
    ```nginx
    server {
        listen 80;
        server_name yourdomain.com;
        root /opt/120-potential/frontend/dist;
        index index.html;

        location /api/ {
            proxy_pass http://127.0.0.1:8079/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```
- **Option 2: Any static file host** (Vercel, Netlify, etc.)
  - Deploy the `dist/` folder as a static site.
  - Ensure API requests are proxied to your backend.

---

## 4. Environment & Security Notes
- Never commit secrets (API keys, DB passwords) to git.
- Use HTTPS in production.
- Restrict CORS origins in `main.py` to your production domain.
- Set proper permissions on `.env` files.

---

## 5. Useful Commands
- **Backend:**
  - Start: `gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8079 --workers 2`
  - DB migration: `python migrate_db.py`
- **Frontend:**
  - Build: `npm run build`
  - Dev: `npm run dev`

---

## 6. Application URLs
- **Frontend:** http://yourdomain.com/
- **Backend API:** http://yourdomain.com/api/
- **Admin Add Question:** http://yourdomain.com/add-question

---

## 7. Troubleshooting
- Check backend logs for errors (`journalctl` or `supervisorctl` if using a process manager).
- Ensure PostgreSQL is running and accessible.
- Confirm environment variables are set and correct.
- For CORS/API issues, verify nginx proxy and allowed origins.

---

## 8. Optional: Google Auth Setup
- For Google login, ensure your OAuth credentials are set up for your production domain in the Google Cloud Console.

---

**For further details, see the `README.md` files in each subfolder.**
