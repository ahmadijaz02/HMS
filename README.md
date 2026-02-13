# Hospital Management System - SonarQube Deployment & Dockerization

## Project Overview

The Hospital Management System (HMS) is a comprehensive web-based application designed to streamline hospital operations and improve patient care management. The system includes appointment scheduling, medical records management, prescription handling, doctor-patient communication, and administrative dashboards.

**Tech Stack:**
- **Frontend:** React.js, Node.js (Client)
- **Backend:** Node.js, Express.js (Server)
- **Deployment:** Docker & Docker Compose
- **Code Quality:** SonarQube
- **Database:** MongoDB

**Key Features:**
- Patient appointment booking and management
- Doctor schedule and availability management
- Medical records and prescription management
- Real-time chat between doctors and patients
- Admin dashboard for user and appointment management
- User authentication with Google OAuth support
- Responsive UI for web browsers

---

## Table of Contents
1. [Docker Deployment](#docker-deployment)
2. [SonarQube Setup](#sonarqube-setup)
3. [Project Analysis](#project-analysis)
4. [Security Hotspots Review](#security-hotspots-review)

---

## Docker Deployment

### What You Need
Make sure you have Docker Desktop installed and running on your machine. You'll also need PowerShell or Command Prompt and an internet connection to pull the SonarQube image.

### Step 1: Pull the SonarQube Image

Start by pulling the latest SonarQube Docker image:

```powershell
docker pull sonarqube:latest
```

This downloads the official SonarQube image from Docker Hub. It's about 500MB in size, so it might take a minute or two depending on your internet speed.

### Step 2: Run the SonarQube Container

Now let's spin up the container. This command will start SonarQube and make it accessible on port 9000:

```powershell
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
```

Breaking it down:
- `-d`: Runs in the background so you can keep using your terminal
- `--name sonarqube`: Names the container "sonarqube" for easy reference
- `-p 9000:9000`: Maps port 9000 from the container to your machine

The container will start initializing. It takes about 30-60 seconds to be fully ready, so be patient!

### Step 3: Check if It's Running

Once you think it's ready, verify that the container is actually running:

```powershell
docker ps
```

You should see something like this:

```
CONTAINER ID   IMAGE              STATUS            PORTS                    NAMES
a1b2c3d4e5f6   sonarqube:latest   Up 2 minutes      0.0.0.0:9000->9000/tcp  sonarqube
```

If you see the sonarqube container listed and it says "Up" in the STATUS column, you're good to go!

---

## SonarQube Setup

### Step 1: Open SonarQube in Your Browser

Open your browser and go to:
```
http://localhost:9000
```

You'll see the SonarQube login page.

### Step 2: Login with Default Credentials

SonarQube comes with default admin credentials:
- **Username:** `admin`
- **Password:** `admin`

Log in with these. On your first login, you'll be asked to change the password to something more secure. Go ahead and do that.

### Step 3: Create Your Projects

We need to create two separate projects - one for the frontend (Client) and one for the backend (Server).

**For the Client Project:**
1. Click **Projects** → **Create project**
2. Choose **Manually**
3. Fill in:
   - Project Key: `Hospital-Management-system`
   - Project Name: `Hospital Management System`
4. Hit **Set Up**

**For the Server Project:**
1. Repeat the same process, but this time use:
   - Project Key: `Hospital-Management-system-server`
   - Project Name: `Hospital Management System - Server`

### Step 4: Generate Your Authentication Token

You'll need a token to let SonarScanner authenticate with SonarQube:

1. Click the user icon in the top right → **My Account** (or go to **Administration** → **Security**)
2. Go to **Security** tab
3. Under "Tokens" section, enter a token name like `HMS-Analysis-Token`
4. Click **Generate**
5. Copy the token immediately (you won't be able to see it again!)

---

## Project Analysis

### Before You Start

First, make sure you have sonar-scanner installed globally. If you don't have it yet:

```powershell
npm install -g sonar-scanner
```

### Analyzing the Frontend (Client)

Navigate to the Client folder:

```powershell
cd C:\Users\Ahmad\Desktop\HMS\Client
```

Now run the analysis on your Client project. Replace the token with the one you generated earlier:

```powershell
npx sonar-scanner --define sonar.host.url=http://localhost:9000 --define sonar.token=sqp_2789f391274a6e823896ec3f49ff0adcfb216744 --define sonar.projectKey=Hospital-Management-system
```

This will scan all your React components, CSS files, and configurations. The first time you run this, it'll take a bit longer (around 1-2 minutes) because it needs to build the analysis cache.

When it's done, you should see:
```
INFO: ANALYSIS SUCCESSFUL, you can find the results at: http://localhost:9000/dashboard?id=Hospital-Management-system
INFO: EXECUTION SUCCESS
```

### Analyzing the Backend (Server)

Now let's scan the backend code:

```powershell
cd C:\Users\Ahmad\Desktop\HMS\server
```

Run the analysis again with the server project key:

```powershell
npx sonar-scanner --define sonar.host.url=http://localhost:9000 --define sonar.token=sqp_2789f391274a6e823896ec3f49ff0adcfb216744 --define sonar.projectKey=Hospital-Management-system-server
```

### View Your Results

Once both analyses are done, head over to the dashboards to check out the results:

- **Client Dashboard:** http://localhost:9000/dashboard?id=Hospital-Management-system
- **Server Dashboard:** http://localhost:9000/dashboard?id=Hospital-Management-system-server

You'll see metrics like code smells, bugs, vulnerabilities, coverage, and more!

---

## Code Quality Improvements

When we ran the analysis, SonarQube flagged a few security and best-practice issues in our Dockerfiles. Here's what we found and fixed:

### Issue #1: Docker Containers Running as Root

**The Problem:**
Our Nginx and Node containers were running as the `root` user. This is a security risk because if someone manages to escape the container, they'd have root-level access to the system.

**The Fix:**
We created non-root users for both containers.

For the **Client/Dockerfile** (Nginx):
```dockerfile
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -c "Nginx web server" -G nginx nginx && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx

USER nginx
```

For the **server/Dockerfile** (Node.js):
```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs
```

### Issue #2: Inefficient Docker Layers

**The Problem:**
We had separate `RUN` commands for creating users and copying files. Each `RUN` instruction creates a new layer in the Docker image, making it larger and slower.

**The Fix:**
We combined multiple commands using `&&` to keep everything in one layer:

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
```

### Issue #3: Sensitive Data Being Copied Into the Image

**The Problem:**
Using `COPY . .` without restrictions could accidentally include `.env` files, node_modules, or other sensitive data in the Docker image.

**The Fix:**
We created `.dockerignore` files in both the Client and Server directories. Think of it like `.gitignore` but for Docker:

```
node_modules
npm-debug.log
.env
.env.local
.gitignore
.vscode
coverage
.DS_Store
```

This ensures that when we copy files into the container, these sensitive and unnecessary files are excluded.

---

## Security Hotspots Review

SonarQube flagged one security hotspot for manual review: the `COPY . .` instruction in our Dockerfiles. This is actually a good catch - SonarQube wants to make sure we're not accidentally copying sensitive files into our containers.

### What's the Risk?

Running `COPY . .` without any restrictions could theoretically copy:
- `.env` files with API keys and secrets
- `node_modules` folders (unnecessary bloat)
- Git history and configuration
- IDE settings and cache files

### How We Mitigated It

We created `.dockerignore` files that explicitly exclude these files, making the copy operation safe. This is similar to `.gitignore` but for Docker.

### Marking It as Reviewed

Since we've addressed the risk, we need to tell SonarQube that we've reviewed this and it's safe:

1. Go to the project dashboard: http://localhost:9000/dashboard?id=Hospital-Management-system
2. Click the **Security Hotspots** tab
3. Find the "Copying recursively..." hotspot
4. Click **Review** button
5. Select the status: **Reviewed** → **Safe**
6. Add a comment explaining the mitigation:
   ```
   Protected by .dockerignore file which excludes node_modules, 
   .env files, git history, and other sensitive data
   ```
7. Click **Save**

Do the same for the Server project hotspot. Once both are marked as reviewed, the quality gate will pass!

---

## Quality Gate Status

### Frontend (Client) - Analysis Results

✅ **Quality Gate: PASSED**

- **Files Analyzed:** 51 total
  - JavaScript/TypeScript: 35 files
  - CSS: 3 files
  - Docker: 1 file
  - HTML & JSON: 12 files
- **Lines of Code:** 4.5k
- **Code Issues:** 0 (after fixes)
- **Security Hotspots:** Reviewed and marked as safe
- **Code Duplications:** 0.0% (Good!)

### Backend (Server) - Analysis Results

✅ **Quality Gate: PASSED**

- **Files Analyzed:** 30 total
- **Code Issues:** 0 (after fixes)
- **Security Hotspots:** Reviewed and marked as safe

Both projects are now passing quality gates and ready for deployment!

---

## Troubleshooting

### SonarQube won't start or is slow?

Check the container logs:
```powershell
docker logs sonarqube
```

If it's still initializing, give it more time. The first startup can take 1-2 minutes.

To restart the container:
```powershell
docker restart sonarqube
```

### Scanner can't connect to SonarQube?

Make sure:
- SonarQube is running: `docker ps`
- You can access it in browser: http://localhost:9000
- The URL in your scan command is correct (should be `http://localhost:9000`)
- Your token is still valid

### Analysis failed?

Common issues:
- You're not in the right directory (Client or server folder)
- Token has expired
- Network connectivity issues
- Missing sonar-scanner: `npm install -g sonar-scanner`

---

## Files Modified

### Docker Security Enhancements
- `Client/Dockerfile` - Added non-root nginx user
- `server/Dockerfile` - Added non-root nodejs user
- `Client/.dockerignore` - Excludes sensitive files
- `server/.dockerignore` - Excludes sensitive files

### Dockerfile Changes Summary
```
BEFORE: Running as root, multiple RUN instructions, no .dockerignore
AFTER:  Non-root user, optimized RUN layers, .dockerignore protection
```
**SonarQube Version:** 26.2.0  
**Docker Desktop:** Latest
