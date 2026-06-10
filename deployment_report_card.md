# Deployment Platforms Report Card: Backend Hosting Analysis
**Project:** Saadhyam Business LLM Backend (FastAPI + Redis + Celery + SQLite/PostgreSQL)  
**Objective:** Evaluation of hosting platforms to replace exhausted Railway and Render services.

---

## 1. Executive Summary
The backend system requires three components to run concurrently: the FastAPI web server, a Redis message broker, and a Celery background worker. Because of these requirements, standard free tiers on Platform-as-a-Service (PaaS) providers quickly exhaust their limits or fail due to storage constraints. 

Below is the evaluation of hosting solutions based on cost, configuration complexity, and resource limits.

---

## 2. Platform Report Cards

### AWS EC2 (Virtual Private Server)
*   **Overall Grade:** A
*   **Monthly Cost:** $0.00 (Free Tier) to $12.00 / month
*   **Setup Complexity:** High (Requires manual terminal setup and Docker installation)
*   **Resource Limits:** None (You control 100% of the allocated disk space and memory)
*   **Pros:** 
    *   Highly cost-effective; fits within the AWS Free Tier (t3.micro) for the first year.
    *   No resource timeouts or sleeping servers.
    *   Allows running FastAPI, Redis, and Celery on a single virtual server.
*   **Cons:** 
    *   Requires managing your own security groups, SSH access, and reverse proxy setup (Nginx).

---

### Railway (Platform-as-a-Service)
*   **Overall Grade:** B-
*   **Monthly Cost:** $5.00 minimum (Metered by execution usage)
*   **Setup Complexity:** Low (One-click deployment from GitHub)
*   **Resource Limits:** Strict credit caps on the free tier ($5 usage limit per month)
*   **Pros:** 
    *   Fastest setup time; handles database provisioning automatically.
    *   Good developer interface.
*   **Cons:** 
    *   Once credits are exhausted, all services shut down immediately.
    *   Metered pricing can become unpredictable as traffic or worker tasks increase.

---

### Render (Platform-as-a-Service)
*   **Overall Grade:** C
*   **Monthly Cost:** $7.00/month per service (Free tier lacks persistent disk storage)
*   **Setup Complexity:** Low (Direct GitHub integration)
*   **Resource Limits:** Free web services sleep after 15 minutes of inactivity; zero persistent disk storage on free tiers.
*   **Pros:** 
    *   Simple setup for static sites and simple APIs.
*   **Cons:** 
    *   Unsuitable for Celery background workers because background services cannot run on the free tier.
    *   Persistent storage requires a paid plan, causing SQLite databases to reset on every server restart.

---

### Fly.io (Micro-VMs Container Hosting)
*   **Overall Grade:** B
*   **Monthly Cost:** Free tier covers up to 3 micro VMs ($5.00+ otherwise)
*   **Setup Complexity:** Medium (Requires Fly CLI tool configurations)
*   **Resource Limits:** Free tier gives only 256 MB RAM per VM, causing OOM errors for heavy Python apps.
*   **Pros:** 
    *   Global distribution; runs close to the user database.
*   **Cons:** 
    *   Very low memory limits on the free tier. FastAPI and Celery workers frequently crash due to memory limitations.

---

## 3. Comparison Matrix

| Feature | AWS EC2 (Docker) | Railway | Render | Fly.io |
| :--- | :--- | :--- | :--- | :--- |
| **Setup Speed** | Slow (30-60 mins) | Fast (5 mins) | Fast (10 mins) | Medium (20 mins) |
| **Pricing Predictability** | Fixed monthly cost | Metered (Variable) | Fixed per service | Metered (Variable) |
| **Celery Support** | Yes (Run as container) | Yes (Charged extra) | Paid tiers only | Yes (Separate VM) |
| **Persistent Storage** | Yes (EBS volumes) | Yes (Paid volumes) | Paid tiers only | Yes (Paid volumes) |
| **Auto-Sleeping** | No | No | Yes (Free tier) | Yes (Free tier) |
| **Technical Control** | Full root access | UI Config only | UI Config only | CLI Config only |

---

## 4. Final Recommendation

For this project, **AWS EC2 running Docker Compose** is the recommended deployment strategy. 

While PaaS providers like Railway and Render are excellent for initial prototypes, their resource limits and cost structures make them unsuitable for hosting a multi-process architecture (FastAPI + Redis + Celery) for free or at a low cost. AWS EC2 provides a stable, professional hosting environment that will not shut down due to credit exhaustion or server inactivity.
