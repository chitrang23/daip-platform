# DAIP Platform (Developer Authenticity Intelligence Platform) 🛡️

I built DAIP to solve a real, practical challenge in today's software engineering space: figuring out if a developer actually wrote their codebase, or if they simply copy-pasted massive chunks from ChatGPT or lifted it from an open-source mirror without understanding the logic.

Instead of writing a single, massive, messy script, I chose to design this platform using a **Microservices Architecture**. This decouples our fast data ingestion tasks from our heavy AI analysis algorithms so the system can scale smoothly.

---

## 🏗️ Core Architecture Overview

The ecosystem operates across three distinct, decoupled layers that communicate over local network ports:

1. **The Ingestion Gateway (Node.js & Express - Port 3000):** This handles the external connection layer. It securely interfaces with the GitHub REST API using an access token, pulls down recent commit histories, and strips out the exact text lines added in each save frame.
2. **The AI Analytics Brain (Python & FastAPI - Port 8000):** This is where the heavy computational and mathematical processing happens. It checks the "predictability" of the code layout. Human code naturally contains chaotic spacing and structural variation, while AI-generated code leaves a highly uniform, mathematically consistent token trail.
3. **The Speed Guard (Memurai / Redis - Port 6379):** A lightweight, in-memory caching service running in the background. It remembers recent repository scans to prevent the application from crashing or getting rate-limited if a user continuously refreshes their report.

---

## 🛠️ Tech Stack Chosen

* **Backend Gateway:** Node.js, Express, Axios
* **AI Compute Cluster:** Python, FastAPI, Uvicorn
* **Database Caching:** Memurai / Redis (Windows Native Environment)
* **API Integration Target:** GitHub REST API v3

---

##🚀 Local Installation & Deployment Steps

To fire up the entire microservice ecosystem on your local machine, execute these configuration and startup steps sequentially:

## Secure Your Environment Variables
Create a plain text file named exactly `.env` in the root directory of the project. Put your personal GitHub access token inside it so the gateway can make authorized high-rate requests.
```env
GITHUB_TOKEN=your_secret_github_token_here