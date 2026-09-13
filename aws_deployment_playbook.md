# LogLens Comprehensive AWS Deployment Playbook

This document contains the end-to-end steps to deploy LogLens to AWS, verify it, and defend it in an interview. 

---

## PHASE 4 & 5: EC2 Provisioning & Server Setup

### 1. Launch the EC2 Instance
1. In the AWS Console, go to **EC2** -> **Instances** -> **Launch instances**.
2. **Name:** `loglens-production`
3. **AMI (OS):** Select **Ubuntu 24.04 LTS** (or 22.04 LTS).
4. **Instance Type:** Select **t3.small** (or t2.micro if you are strictly trying to stay in the free tier, but Next.js/Docker can consume a lot of RAM during build/startup. t3.small gives you 2GB of RAM).
5. **Key Pair:** Click **Create new key pair**. 
   - Name it `loglens-prod-key`. 
   - Type: RSA, Format: `.pem`. 
   - **Download this key and do not lose it.**
6. **Network Settings:**
   - Auto-assign Public IP: Enable.
   - Click **Create security group**.
   - Check: **Allow SSH traffic** from **Anywhere** (0.0.0.0/0). *(Note: In a real enterprise, you restrict SSH to your corporate VPN IP. For learning, Anywhere is fine).*
   - Check: **Allow HTTP traffic from the internet**.
   - Check: **Allow HTTPS traffic from the internet**.
7. **Storage:** Increase to **20 GB** (gp3). Docker images take up significant space.
8. Click **Launch instance**.

### 2. Connect to the Server
Open your local terminal (where your `.pem` file downloaded):
```bash
# Secure the key file (macOS/Linux)
chmod 400 loglens-prod-key.pem

# SSH into the server (replace the IP with your EC2 Public IP)
ssh -i "loglens-prod-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

### 3. Install Docker and Nginx
Once inside the EC2 terminal, run these commands to prepare the server:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install docker.io docker-compose -y

# Add ubuntu user to the docker group so you don't need 'sudo' for docker
sudo usermod -aG docker ubuntu

# Install Nginx
sudo apt install nginx -y

# Apply group changes (you will be logged out, just SSH back in)
exit
```

---

## PHASE 6: MongoDB Atlas Setup

1. Log into MongoDB Atlas. Create a free cluster (M0).
2. Go to **Database Access**: Create a user (e.g., `loglens_user`) and auto-generate a secure password. **Copy the password.**
3. Go to **Network Access**: 
   - Click Add IP Address.
   - Best Practice: Add ONLY the **Public IP of your EC2 instance**.
   - *Why?* This prevents anyone on the internet from brute-forcing your database. If your EC2 IP changes (because you stopped and started it), you must update this rule.
4. Go to **Database** -> **Connect** -> **Drivers**. Copy the connection string. It will look like:
   `mongodb+srv://loglens_user:<password>@cluster0...`

---

## PHASE 7 & 8: Code & Docker Configuration

1. SSH back into your EC2 instance.
2. Clone your repository (you can use HTTPS and a GitHub Personal Access Token, or just copy the files over using `scp` for now).
```bash
git clone https://github.com/<YOUR_USERNAME>/loglens.git
cd loglens
```

### Critical Security Fix (docker-compose.yml)
Before running Docker, we must prevent external users from accessing ports 3000 and 4000 directly, bypassing Nginx.
Edit `docker-compose.yml` on the server (or locally and push to GitHub):
```yaml
  backend:
    # ...
    ports:
      - "127.0.0.1:4000:4000" # CHANGED from "4000:4000"
      
  frontend:
    # ...
    ports:
      - "127.0.0.1:3000:3000" # CHANGED from "3000:3000"
```
*Why?* Binding to `127.0.0.1` means Docker only exposes these ports to the internal localhost of the EC2 instance. Only Nginx (which also runs on the EC2 host) can talk to them.

### Environment Configuration
Create the `.env` file in the root of the project on the server:
```bash
nano .env
```
Paste your production values:
```env
MONGODB_URI=mongodb+srv://loglens_user:<YOUR_PASSWORD>@cluster0...
JWT_SECRET=generate_a_long_random_string_here
GROQ_API_KEY=gsk_your_groq_api_key
IMAGE_TAG=latest
DOCKERHUB_USERNAME=local
```
*(Save and exit nano: `Ctrl+O`, `Enter`, `Ctrl+X`)*

---

## PHASE 9 & 10: Manual Deployment & Nginx

### Start Docker
```bash
# Build and start the containers in detached mode
docker-compose up -d --build
```
Verify they are running:
```bash
docker ps
```
You should see 5 containers: frontend, backend, worker, ai-service, and redis.

### Configure Nginx
Nginx will act as a Reverse Proxy, taking traffic on Port 80 (HTTP) and forwarding it to the appropriate Docker container.

```bash
sudo nano /etc/nginx/sites-available/loglens
```
Paste this configuration (replace `<YOUR_EC2_PUBLIC_IP>`):
```nginx
server {
    listen 80;
    server_name <YOUR_EC2_PUBLIC_IP>; # Or your domain name

    # Route /api and /socket.io to the Backend (Port 4000)
    location ~ ^/(api|socket\.io) {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Important for WebSocket timeouts
        proxy_read_timeout 86400;
    }

    # Route everything else to the Frontend (Port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/loglens /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl test nginx
sudo systemctl restart nginx
```

### Test the Application
Open your browser and navigate to `http://<YOUR_EC2_PUBLIC_IP>`. 
LogLens should load. Try registering, logging in, and triggering an AI/Worker task to ensure the entire flow works.

---

## PHASE 13 & 14: GitHub Actions CI/CD Setup

To automate future deployments, you need to provide your GitHub repository with the secrets it needs to build images and SSH into your EC2 instance.

Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**. Add these **Repository Secrets**:

1. `DOCKERHUB_USERNAME`: Your Docker Hub username.
2. `DOCKERHUB_TOKEN`: Generate an Access Token in Docker Hub (do not use your password).
3. `PROD_HOST`: Your EC2 Public IP address.
4. `PROD_USERNAME`: `ubuntu`
5. `PROD_SSH_KEY`: The entire contents of your `loglens-prod-key.pem` file (including the `-----BEGIN...` and `-----END...` lines).

Go to the **Variables** tab (next to Secrets) and add:
1. `PROD_PROJECT_PATH`: `/home/ubuntu/loglens`

**Automated Deployment Test:**
Commit a small visual change to your frontend code and push it to the `main` branch. Go to the "Actions" tab in GitHub and watch the pipeline build, push to Docker Hub, SSH into your EC2 instance, and run `deploy.sh`.

---

## PHASE 15 & 12: Failure & Rollback Testing

**To test the rollback script:**
1. Intentionally break your `backend/src/index.ts` (e.g., add a syntax error).
2. Commit and push to `main`.
3. Watch the CI pipeline. The `deploy.sh` script on the server will attempt to run the new container, but the health check `curl -s http://localhost:4000/api/v1/health` will fail.
4. The script will output `Health checks failed. Initiating rollback to <PREV_TAG>...` and will automatically spin the previous working version back up.
5. The GitHub Action will be marked as "Failed" (red X), alerting you to the issue, but your production site will remain online using the older version.

---

## PHASE 20: Interview Cheat Sheet

Here are the critical questions an interviewer will ask about this specific architecture, and how to defend it:

**1. Why did you choose EC2 + Docker Compose instead of ECS or Kubernetes?**
> "For a startup or learning project, EC2 with Docker Compose provides the perfect balance of control and simplicity. Kubernetes introduces massive operational overhead and costs for the control plane. ECS is great, but requires configuring ALBs and NAT Gateways which significantly increase the baseline cost. By using EC2, I was able to deploy a multi-container microservice architecture while keeping infrastructure costs minimal, while still utilizing containerization for environment consistency."

**2. How did you secure the application?**
> "At the network layer, the AWS Security Group only allows inbound traffic on ports 80 (HTTP), 443 (HTTPS), and 22 (SSH). At the host layer, I bound the Docker ports (3000 and 4000) strictly to `127.0.0.1`. This ensures that even if someone figures out the backend port, they cannot bypass Nginx. Finally, for the database, I restricted MongoDB Atlas network access exclusively to the EC2 instance's Elastic IP."

**3. How does your CI/CD pipeline authenticate with AWS?**
> "It actually doesn't authenticate with AWS IAM at all. The deployment is infrastructure-agnostic. GitHub Actions builds the Docker images, pushes them to Docker Hub, and then uses a standard SSH key to log into the Ubuntu OS. Once inside, it runs a bash script that pulls the new images and triggers a Docker Compose recreation."

**4. What happens if the EC2 instance crashes?**
> "Because I configured `restart: unless-stopped` in my Docker Compose file, if the server reboots, the Docker daemon will automatically restart all the containers. However, this is a single point of failure architecture. If the underlying EC2 hardware fails, the application goes down until a new instance is spun up. For a true highly-available (HA) production environment, I would migrate this to ECS with an Auto Scaling Group across multiple Availability Zones."

**5. How do you handle zero-downtime deployments?**
> "Currently, `docker-compose up -d` causes a few seconds of downtime while containers are recreated. However, I built a health-check driven rollback mechanism in my `deploy.sh` script. If a deployment fails health checks, it immediately rolls back to the previous image tag. To achieve true zero-downtime in the future, I would implement a Blue/Green deployment strategy using an Application Load Balancer."

**6. Why is Redis running inside Docker, but MongoDB is external?**
> "Redis is acting as an ephemeral cache and message queue for BullMQ. If the container crashes and we lose the queue, jobs might fail, but the core persistent state of the application is safe. MongoDB holds the critical user and application data. Running a stateful, replicated database inside a single-node Docker Compose setup is risky for data integrity and backups. Using a managed service like Atlas offloads backups, scaling, and high availability."
