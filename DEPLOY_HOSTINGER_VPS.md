# Deploying Monisha Kitchen to Hostinger VPS

## Prerequisites
- Hostinger VPS with Ubuntu 22.04 or 24.04
- SSH access to your VPS
- A domain name (optional but recommended)
- Your Firebase credentials (API key, App ID, Project ID, Storage Bucket)

---

## Step 1: Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
```

---

## Step 2: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Should show v20.x
npm -v   # Should show 10.x
```

---

## Step 3: Install PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create the database and user:

```bash
sudo -u postgres psql
```

In the PostgreSQL shell:

```sql
CREATE USER monisha WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE monisha_kitchen OWNER monisha;
GRANT ALL PRIVILEGES ON DATABASE monisha_kitchen TO monisha;
\q
```

---

## Step 4: Install PM2 (Process Manager)

PM2 keeps your app running even after you close the terminal or the server restarts.

```bash
sudo npm install -g pm2
```

---

## Step 5: Upload Your App

### Option A: Using Git (Recommended)

Push your code to a Git repository (GitHub, GitLab, etc.), then on your VPS:

```bash
cd /home
git clone YOUR_REPO_URL monisha-kitchen
cd monisha-kitchen
```

### Option B: Using SCP/SFTP

From your local machine, upload all project files:

```bash
scp -r ./your-project-folder root@YOUR_VPS_IP:/home/monisha-kitchen
```

Then on VPS:
```bash
cd /home/monisha-kitchen
```

---

## Step 6: Install Dependencies

```bash
npm install
```

---

## Step 7: Set Up Environment Variables

Create the `.env` file:

```bash
nano .env
```

Paste the following (replace with your actual values):

```
DATABASE_URL=postgresql://monisha:your_strong_password_here@localhost:5432/monisha_kitchen
PORT=5000
NODE_ENV=production
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
```

Save and exit (Ctrl+X, then Y, then Enter).

---

## Step 8: Build the App

```bash
npm run build
```

This creates the `dist/` folder with:
- `dist/index.cjs` — the compiled server
- `dist/public/` — the compiled frontend

---

## Step 9: Set Up the Database Tables

```bash
npx drizzle-kit push
```

This creates all the required database tables (menu_items, orders, customers, etc.).

---

## Step 10: Start the App with PM2

```bash
pm2 start dist/index.cjs --name monisha-kitchen
pm2 save
pm2 startup
```

The last command will give you a command to copy and run — this ensures PM2 starts automatically on server reboot.

### Verify it's running:

```bash
pm2 status
curl http://localhost:5000/api/settings
```

You should see the store settings JSON response.

---

## Step 11: Set Up Nginx (Reverse Proxy)

Nginx handles incoming web traffic and forwards it to your Node.js app.

```bash
sudo apt-get install -y nginx
```

Create a new site configuration:

```bash
sudo nano /etc/nginx/sites-available/monisha-kitchen
```

Paste:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Replace `YOUR_DOMAIN_OR_IP` with your domain (e.g., `monishakitchen.com`) or VPS IP address.

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/monisha-kitchen /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Your app should now be accessible at `http://YOUR_DOMAIN_OR_IP`.

---

## Step 12: Set Up HTTPS with Let's Encrypt (If using a domain)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

Follow the prompts. Certbot will automatically configure HTTPS and set up auto-renewal.

---

## Useful Commands

### View app logs:
```bash
pm2 logs monisha-kitchen
```

### Restart the app:
```bash
pm2 restart monisha-kitchen
```

### Update the app (after uploading new code):
```bash
cd /home/monisha-kitchen
git pull                  # if using git
npm install               # if dependencies changed
npm run build
pm2 restart monisha-kitchen
```

### Check database:
```bash
sudo -u postgres psql -d monisha_kitchen
```

---

## Firewall Setup

Make sure ports 80 (HTTP) and 443 (HTTPS) are open:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Firebase Configuration

Make sure in your Firebase Console:
1. **Authentication > Sign-in method**: Phone authentication is enabled
2. **Authentication > Settings > Authorized domains**: Add your domain
3. **Storage > Rules**: Ensure uploads are allowed for authenticated users

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App not loading | Run `pm2 logs monisha-kitchen` to check errors |
| Database connection error | Verify DATABASE_URL in `.env` and PostgreSQL is running: `sudo systemctl status postgresql` |
| Firebase auth not working | Add your domain to Firebase Authorized Domains |
| Images not uploading | Check Firebase Storage rules and VITE_FIREBASE_STORAGE_BUCKET value |
| 502 Bad Gateway | App may have crashed — run `pm2 restart monisha-kitchen` |
| Port already in use | Run `sudo lsof -i :5000` to find and kill the conflicting process |
