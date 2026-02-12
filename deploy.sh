#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="monisha-kitchen"
APP_DIR="/home/$APP_NAME"
REPO_URL="https://github.com/dgap321/monisha-kitchen.git"

print_step() { echo -e "\n${BLUE}=================================================="; echo -e "  $1"; echo -e "==================================================${NC}\n"; }
print_ok() { echo -e "${GREEN}✓ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_err() { echo -e "${RED}✗ $1${NC}"; }

if [ "$EUID" -ne 0 ]; then
  print_err "Please run as root: sudo bash deploy.sh"
  exit 1
fi

print_step "MONISHA KITCHEN - One Command Deploy"
echo "This script will set up everything on your VPS:"
echo "  1. Install Node.js 20, PostgreSQL, PM2, Nginx"
echo "  2. Download your app from GitHub"
echo "  3. Set up the database"
echo "  4. Configure Firebase keys"
echo "  5. Build and start the app"
echo "  6. Set up Nginx with your domain"
echo "  7. Enable HTTPS (SSL certificate)"
echo ""

read -p "Enter your domain name (e.g. kitchenofmonisha.in) or press Enter to skip: " DOMAIN
DOMAIN=${DOMAIN:-"_"}

print_step "Step 1/8: Installing System Packages"

if command -v node &> /dev/null && node -v | grep -q "v20\|v22"; then
  print_ok "Node.js already installed: $(node -v)"
else
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y nodejs > /dev/null 2>&1
  print_ok "Node.js installed: $(node -v)"
fi

if command -v psql &> /dev/null; then
  print_ok "PostgreSQL already installed"
else
  echo "Installing PostgreSQL..."
  apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
  systemctl start postgresql
  systemctl enable postgresql > /dev/null 2>&1
  print_ok "PostgreSQL installed and running"
fi

if command -v pm2 &> /dev/null; then
  print_ok "PM2 already installed"
else
  echo "Installing PM2..."
  npm install -g pm2 > /dev/null 2>&1
  print_ok "PM2 installed"
fi

if command -v nginx &> /dev/null; then
  print_ok "Nginx already installed"
else
  echo "Installing Nginx..."
  apt-get update > /dev/null 2>&1
  apt-get install -y nginx > /dev/null 2>&1
  print_ok "Nginx installed"
fi

if ! command -v certbot &> /dev/null; then
  apt-get install -y certbot python3-certbot-nginx > /dev/null 2>&1
  print_ok "Certbot (SSL) installed"
fi

apt-get install -y git > /dev/null 2>&1

print_step "Step 2/8: Setting Up Database"

DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='monisha_kitchen'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
  print_ok "Database 'monisha_kitchen' already exists"
  read -p "Enter existing database password for user 'monisha' (or press Enter to reset it): " EXISTING_PASS
  if [ -n "$EXISTING_PASS" ]; then
    DB_PASS="$EXISTING_PASS"
  else
    sudo -u postgres psql -c "ALTER USER monisha WITH PASSWORD '$DB_PASS';" > /dev/null 2>&1
    print_ok "Database password reset"
  fi
else
  sudo -u postgres psql -c "CREATE USER monisha WITH PASSWORD '$DB_PASS';" > /dev/null 2>&1 || true
  sudo -u postgres psql -c "CREATE DATABASE monisha_kitchen OWNER monisha;" > /dev/null 2>&1
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE monisha_kitchen TO monisha;" > /dev/null 2>&1
  print_ok "Database created: monisha_kitchen (user: monisha)"
fi

DATABASE_URL="postgresql://monisha:${DB_PASS}@localhost:5432/monisha_kitchen"

print_step "Step 3/8: Downloading App from GitHub"

if [ -d "$APP_DIR" ]; then
  print_warn "App directory already exists. Updating..."
  cd "$APP_DIR"
  git fetch origin > /dev/null 2>&1
  git reset --hard origin/main > /dev/null 2>&1 || git reset --hard origin/master > /dev/null 2>&1
  print_ok "App updated from GitHub"
else
  echo "Cloning from GitHub..."
  git clone "$REPO_URL" "$APP_DIR" > /dev/null 2>&1
  cd "$APP_DIR"
  print_ok "App downloaded to $APP_DIR"
fi

cd "$APP_DIR"

print_step "Step 4/8: Firebase Configuration"

if [ -f "$APP_DIR/.env" ]; then
  print_warn "Existing .env file found"
  read -p "Keep existing .env file? (y/n): " KEEP_ENV
  if [ "$KEEP_ENV" = "y" ] || [ "$KEEP_ENV" = "Y" ]; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" "$APP_DIR/.env"
    print_ok "Updated DATABASE_URL in existing .env"
  else
    rm "$APP_DIR/.env"
  fi
fi

if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "You need your Firebase credentials. Find them at:"
  echo "  https://console.firebase.google.com > Project Settings > General"
  echo "  Your project: nvzg-a9977"
  echo ""

  read -p "Firebase API Key: " FB_API_KEY
  read -p "Firebase App ID: " FB_APP_ID
  read -p "Firebase Project ID (press Enter for nvzg-a9977): " FB_PROJECT_ID
  FB_PROJECT_ID=${FB_PROJECT_ID:-"nvzg-a9977"}
  read -p "Firebase Storage Bucket (press Enter for ${FB_PROJECT_ID}.firebasestorage.app): " FB_STORAGE
  FB_STORAGE=${FB_STORAGE:-"${FB_PROJECT_ID}.firebasestorage.app"}

  cat > "$APP_DIR/.env" << ENVEOF
DATABASE_URL=$DATABASE_URL
PORT=5000
NODE_ENV=production
VITE_FIREBASE_API_KEY=$FB_API_KEY
VITE_FIREBASE_APP_ID=$FB_APP_ID
VITE_FIREBASE_PROJECT_ID=$FB_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=$FB_STORAGE
ENVEOF

  print_ok ".env file created"
fi

print_step "Step 5/8: Installing Dependencies"

echo "Installing npm packages (this may take 2-3 minutes)..."
npm install > /dev/null 2>&1
print_ok "Dependencies installed"

print_step "Step 6/8: Building the App"

echo "Building (this may take 1-2 minutes)..."
set -a
source .env
set +a
npm run build > /dev/null 2>&1
print_ok "App built successfully"

echo "Setting up database tables..."
npx drizzle-kit push > /dev/null 2>&1
print_ok "Database tables created"

print_step "Step 7/8: Starting the App with PM2"

pm2 delete $APP_NAME > /dev/null 2>&1 || true
cd "$APP_DIR"
pm2 start dist/index.cjs --name $APP_NAME --env production > /dev/null 2>&1
pm2 save > /dev/null 2>&1

STARTUP_CMD=$(pm2 startup 2>&1 | grep "sudo" | head -1)
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD" > /dev/null 2>&1 || true
fi

sleep 3

if curl -s http://localhost:5000/api/settings > /dev/null 2>&1; then
  print_ok "App is running on port 5000!"
else
  print_warn "App may still be starting up. Check with: pm2 logs $APP_NAME"
fi

print_step "Step 8/8: Configuring Nginx"

if [ "$DOMAIN" != "_" ]; then
  SERVER_NAME="$DOMAIN www.$DOMAIN"
  LISTEN_LINE="listen 80;"
else
  VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
  SERVER_NAME="_"
  LISTEN_LINE="listen 80 default_server;"
fi

cat > /etc/nginx/sites-available/$APP_NAME << NGINXEOF
server {
    $LISTEN_LINE
    server_name $SERVER_NAME;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t > /dev/null 2>&1 && systemctl restart nginx
print_ok "Nginx configured"

if command -v ufw &> /dev/null; then
  ufw allow OpenSSH > /dev/null 2>&1 || true
  ufw allow 'Nginx Full' > /dev/null 2>&1 || true
  echo "y" | ufw enable > /dev/null 2>&1 || true
  print_ok "Firewall configured (ports 80, 443, SSH open)"
fi

if [ "$DOMAIN" != "_" ]; then
  echo ""
  echo "Setting up HTTPS (SSL) for $DOMAIN..."
  echo "Make sure your domain's DNS is pointing to this server's IP first!"
  read -p "Is DNS already pointing here? (y/n): " DNS_READY
  if [ "$DNS_READY" = "y" ] || [ "$DNS_READY" = "Y" ]; then
    read -p "Enter your email for SSL renewal notices (or press Enter to skip): " SSL_EMAIL
    if [ -n "$SSL_EMAIL" ]; then
      CERTBOT_EMAIL="--email $SSL_EMAIL"
    else
      CERTBOT_EMAIL="--register-unsafely-without-email"
    fi
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos $CERTBOT_EMAIL > /dev/null 2>&1 && \
      print_ok "HTTPS enabled for $DOMAIN" || \
      print_warn "SSL setup failed. You can retry later with: sudo certbot --nginx -d $DOMAIN"
  else
    print_warn "Skipping SSL. Run this later when DNS is ready:"
    echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  fi
fi

IMPORTANT_REMINDER=""
if [ "$DOMAIN" != "_" ]; then
  IMPORTANT_REMINDER="
${YELLOW}IMPORTANT - Firebase Setup:${NC}
  Go to https://console.firebase.google.com
  > Authentication > Settings > Authorized domains
  > Add: $DOMAIN
  (Without this, phone login won't work on your domain)
"
fi

print_step "DEPLOYMENT COMPLETE!"

echo -e "${GREEN}Your app is now live!${NC}"
echo ""
if [ "$DOMAIN" != "_" ]; then
  echo -e "  Website: ${GREEN}http://$DOMAIN${NC}"
else
  VPS_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_VPS_IP")
  echo -e "  Website: ${GREEN}http://$VPS_IP${NC}"
fi
echo ""
echo -e "$IMPORTANT_REMINDER"
echo "Useful commands:"
echo "  pm2 logs $APP_NAME          - View app logs"
echo "  pm2 restart $APP_NAME       - Restart the app"
echo "  pm2 status                  - Check app status"
echo ""
echo "To update your app later:"
echo "  cd $APP_DIR"
echo "  git pull"
echo "  npm install"
echo "  npm run build"
echo "  pm2 restart $APP_NAME"
echo ""
echo -e "${GREEN}Merchant Login: Username 'NaBo', Password 'MnD@0246'${NC}"
echo ""
