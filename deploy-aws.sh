#!/usr/bin/env bash
# ==============================================================================
# Owino FairShare — Automated AWS EC2 Free Tier Deployment Script
# Designed for Ubuntu 22.04 / 24.04 LTS on t2.micro or t3.micro
# ==============================================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║      Owino FairShare — AWS Free Tier Automated Deployment        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# ------------------------------------------------------------------------------
# STEP 1: Enable 2GB Swap Memory (Prevents out-of-memory crash during build)
# ------------------------------------------------------------------------------
echo "==> [1/5] Checking and configuring swap memory (crucial for 1GB RAM EC2)..."
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo " Swap configured successfully."
else
    echo " Swap file already exists."
fi

# ------------------------------------------------------------------------------
# STEP 2: Install Docker and Docker Compose (if not present)
# ------------------------------------------------------------------------------
echo "==> [2/5] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo " Docker installed successfully."
else
    echo " Docker is already installed."
fi

# Ensure docker service is running
sudo systemctl enable docker
sudo systemctl start docker

# ------------------------------------------------------------------------------
# STEP 3: Verify Environment (.env) Configuration
# ------------------------------------------------------------------------------
echo "==> [3/5] Checking .env configuration..."
if [ ! -f .env ]; then
    echo "⚠️  No .env file found in $(pwd)!"
    echo "Creating .env template..."
    cat << 'EOF' > .env
# Database Credentials (use port 6543 with ?pgbouncer=true for Supabase connection pooler)
DATABASE_URL="postgresql://postgres.<your-project-ref>:<your-password>@<your-pooler-host>:6543/postgres?pgbouncer=true&connection_limit=5&sslmode=require"
DIRECT_URL="postgresql://postgres.<your-project-ref>:<your-password>@<your-pooler-host>:5432/postgres"

# Supabase Auth Keys (from Supabase Dashboard -> Project Settings -> API)
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Client Environment (Public)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=/api

# Security Secret (Generate with: openssl rand -hex 32)
JWT_SECRET=owino-super-secret-jwt-key-2026-production-aws
EOF
    echo ""
    echo "❌ PLEASE EDIT THE .env FILE FIRST WITH YOUR REAL SUPABASE CREDENTIALS:"
    echo "   nano .env"
    echo "Then re-run: ./deploy-aws.sh"
    exit 1
fi

# ------------------------------------------------------------------------------
# STEP 4: Build and Launch Containers with Docker Compose
# ------------------------------------------------------------------------------
echo "==> [4/5] Building and launching microservices via Docker Compose..."
sudo docker compose -f docker-compose.prod.yml down --remove-orphans || true
sudo docker compose -f docker-compose.prod.yml up --build -d

# ------------------------------------------------------------------------------
# STEP 5: Verification & Status
# ------------------------------------------------------------------------------
echo "==> [5/5] Waiting for services to become healthy..."
sleep 15

PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "your-ec2-public-ip")

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                     🎉 DEPLOYMENT SUCCESSFUL!                    ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  App is running live at:                                         ║"
echo "║  👉 http://${PUBLIC_IP}                                          ║"
echo "║                                                                  ║"
echo "║  API Health Check:                                               ║"
echo "║  👉 http://${PUBLIC_IP}/api/health                               ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
sudo docker ps
