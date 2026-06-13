# uhi-dashboard

> Urban Heat Island monitoring dashboard using React, Flask, and Google Earth Engine.

![GitHub stars](https://img.shields.io/github/stars/swetasingh08/uhi-dashboard?style=for-the-badge&logo=github) ![GitHub forks](https://img.shields.io/github/forks/swetasingh08/uhi-dashboard?style=for-the-badge&logo=github) ![GitHub issues](https://img.shields.io/github/issues/swetasingh08/uhi-dashboard?style=for-the-badge&logo=github) ![Last commit](https://img.shields.io/github/last-commit/swetasingh08/uhi-dashboard?style=for-the-badge&logo=github) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

## 📑 Table of Contents

- [🌐 Live Demo](#-live-demo)
- [🌍 Problem Statement](#problem-statement)
- [🧠 Solution Overview](#solution-overview)
- [✨ Key Features](#key-features)
- [🎯 Use Cases](#use-cases)
- [🛠️ Tech Stack](#tech-stack)
- [⚡ Quick Start](#quick-start)
- [📦 Key Dependencies](#key-dependencies)
- [🚀 Available Scripts](#available-scripts)
- [📁 Project Structure](#project-structure)
- [🛠️ Development Setup](#development-setup)
- [👥 Contributing](#contributing)
- [📜 License](#license)


## 🌐 Live Demo

This project follows a decoupled deployment architecture, where the frontend is hosted on [Vercel](https://vercel.com) for fast global delivery, and the backend is deployed independently on [Render](https://render.com) for scalable API and geospatial processing.

| Environment | URL |
|-------------|-----|
| 🖥️ **Frontend** | https://uhi-dashboard-psi.vercel.app/ |
| 🚂 **Backend API** | https://uhi-dashboard.onrender.com |

## 🌍 Problem Statement

Rapid urbanization has significantly increased land surface temperatures in cities, leading to the formation of **Urban Heat Islands (UHI)**. These hotspots negatively impact:

- 🏥 Public health (heat stress, heatwaves)  
- ⚡ Energy consumption (higher cooling demand)  
- 🌱 Climate resilience (ecosystem imbalance)  

This project addresses the challenge of building a **data-driven geospatial solution** that identifies urban heat hotspots and analyzes relationships between:

- 🌡️ Land Surface Temperature (LST)  
- 🌿 Vegetation Cover (NDVI)  
- 🏢 Built-up Area Density  
- 🗺️ Land-use / land-cover patterns  

## 🧠 Solution Overview

This project solves the problem by leveraging **satellite imagery and geospatial intelligence** to identify and analyze urban heat hotspots while studying the relationship between land surface temperature, vegetation index (NDVI), built-up areas, and land-use distribution. The solution combines a **React-based interactive frontend** with a **Flask backend powered by Google Earth Engine** to fetch, process, and visualize real-time thermal spatial data. This enables users to monitor urban temperature variations efficiently through a responsive dashboard and gain meaningful insights into environmental patterns for better climate-aware decision-making.

## ✨ Key Features

- 🌍 **Google Earth Engine Integration** — Uses the Google Earth Engine Python API with a custom `UHIAnalyzer` service to process satellite-based geospatial thermal data for Urban Heat Island (UHI) analysis.  
- 🐍 **Flask Backend API** — Provides structured REST endpoints with CORS support to serve processed environmental and climate analytics to the frontend.  
- ⚛️ **React Interactive Dashboard** — A responsive UI that visualizes heatmaps, NDVI, land-use data, and UHI intensity using dynamic map-based components.  
- ⚡ **TanStack Query State Management** — Handles API data fetching with caching, auto-refetching, and retry logic for smooth and efficient updates.  
- 🛰️ **Real-time Geospatial Visualization** — Displays satellite-derived layers such as LST, NDVI, and hotspot detection with interactive map overlays.  
- 🐳 **Docker Compose Deployment** — Containerized multi-service architecture (frontend + backend) for easy local setup and reproducibility.  
- 🎨 **Tailwind CSS Styling** — Modern, responsive, and clean UI design for intuitive environmental data exploration.  
- 🤖 **Gemini AI Integration** — Provides intelligent insights and recommendations such as hotspot interpretation, urban greening suggestions, and climate-aware decision support based on analysis results.  
- ☁️ **Vercel Deployment (Frontend)** — Frontend is optimized for deployment on Vercel for fast global CDN delivery and seamless UI hosting.  
- 🚀 **Render Deployment (Backend)** — Flask backend can be deployed on Render for scalable API hosting with environment variable support and continuous deployment.

## 🎯 Use Cases

- 🌡️ Visualizing surface temperature variations and Urban Heat Island (UHI) anomalies in real time using satellite-derived geospatial data.  
- 🛰️ Developing and testing localized spatial analysis workflows with Google Earth Engine and Python for environmental monitoring.  
- 🗺️ Exploring relationships between land surface temperature, vegetation cover (NDVI), built-up density, and land-use patterns.  
- 🧪 Running what-if scenario simulations to study the impact of urban greening, cool roofs, and forestry on temperature reduction.  
- 🐳 Setting up a containerized full-stack dashboard with a decoupled Flask backend and React frontend for scalable deployment.  
- ☁️ Deploying and hosting the system using cloud platforms like Vercel (frontend) and Render (backend) for real-world accessibility.  

## 🛠️ Tech Stack

### 🌐 Frontend
- ⚛️ **React** — Component-based UI for interactive geospatial dashboard  
- ⚡ **Vite** — Fast build tool and development server for React  
- 🗺️ **Deck.gl** — WebGL-powered geospatial visualization for heatmaps and spatial layers  
- 🌍 **Mapbox GL / MapLibre GL / React Map GL** — Interactive mapping engine for rendering spatial data  
- 📊 **Recharts** — Charting library for climate statistics and analytics visualization  
- ⚡ **TanStack Query** — Server-state management for API caching, syncing, and background updates  
- 🎨 **Tailwind CSS** — Utility-first CSS framework for responsive UI design  
- 🔔 **React Hot Toast** — Lightweight notifications system for user feedback  
- 🎯 **Lucide React** — Icon library for modern UI elements  
- 📡 **Axios** — HTTP client for backend API communication  

---

### 🧠 Backend
- 🍶 **Flask** — Lightweight Python framework for REST API development  
- 🌐 **Flask-CORS** — Cross-origin request handling for frontend-backend communication  
- 🛰️ **Google Earth Engine API (`earthengine-api`)** — Satellite data processing and geospatial analysis  
- 🌍 **GeoJSON** — Geospatial data format for spatial feature handling  
- 🧩 **Shapely** — Geometric operations for spatial analysis and polygon handling  
- 🖼️ **Rasterio** — Raster data processing for satellite imagery  
- 🔢 **NumPy** — Numerical computations for geospatial calculations  
- 🔐 **Python Dotenv** — Environment variable management for secure configuration  

---

### 🐳 DevOps & Deployment
- 🐳 **Docker** — Containerization for full-stack deployment and environment consistency  
- 🚀 **Render** — Cloud platform for deploying Flask backend with environment variables and auto-deploy pipelines  
- ⚡ **Vercel** — Frontend hosting platform for fast global CDN deployment of React application  
- ⚡ **Vite + ESLint + PostCSS + Autoprefixer** — Frontend development tooling and optimization  

**Notable libraries:** NumPy, TanStack Query

## ⚡ Quick Start

### 📥 1. Clone the repository
```bash
git clone https://github.com/swetasingh08/uhi-dashboard.git
cd uhi-dashboard
```
### 🧠 2. Backend Setup (Flask)
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python app.py
```
### 🌐 3. Frontend Setup (React)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
###🐳 4. Run with Docker (Optional)
```bash
docker compose up --build
```

## 📦 Key Dependencies

### 🌐 Frontend (package.json)
```bash
- @deck.gl-community/editable-layers — ^9.3.5  
- @tanstack/react-query — ^5.8.0  
- axios — ^1.6.0  
- clsx — ^2.0.0  
- deck.gl — ^9.3.4  
- lucide-react — ^0.294.0  
- mapbox-gl — ^3.24.0  
- maplibre-gl — ^3.6.0  
- react — ^18.2.0  
- react-dom — ^18.2.0  
- react-hot-toast — ^2.4.1  
- react-map-gl — ^7.1.7  
- recharts — ^2.10.0  
```
### 🧠 Backend (requirements.txt)
```bash
- flask — 3.0.0  
- flask-cors — 4.0.0  
- python-dotenv — 1.0.0  
- earthengine-api — 1.7.28  
- numpy — >=1.26,<3  
- rasterio — 1.3.8  
- geojson — 3.1.0  
- shapely — 2.0.2  
```
## 🚀 Available Scripts

### 🌐 Frontend (React)
- **dev** — `npm run dev`
- **build** — `npm run build`
- **preview** — `npm run preview`
- **lint** — `npm run lint`

### 🧠 Backend (Flask)                                                                                                                             
- **start** — `python app.py`
- **env setup** — `python -m venv venv`
- **install deps** — `pip install -r requirements.txt`

## 📁 Project Structure

```
.
├── backend/
│   ├── credentials/
│   │   └── gee-key.json
│   ├── .dockerignore
│   ├── .env
│   ├── app.py
│   ├── Dockerfile
│   ├── gee_service.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KPICards.jsx
│   │   │   ├── LayerControls.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── WhatIfPanel.jsx
│   │   ├── hooks/
│   │   │   └── useUHIAnalysis.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .dockerignore
│   ├── .env
│   ├── .npmrc
│   ├── Dockerfile
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
├── docker-compose.yml
└── LICENSE
  
```

## 🛠️ Development Setup

This section explains the local development environment structure for contributing or modifying the project.

---

### 📦 Prerequisites
Before starting development, ensure you have:
- Node.js (v18+ recommended)
- Python (v3.10+ recommended)
- Git installed
- Docker (optional but recommended)

---

### 🧠 Project Architecture (Important)
This is a **full-stack geospatial system**:

- 🌐 Frontend → React + Vite + Deck.gl (UI + Map Visualization)
- 🧠 Backend → Flask + Google Earth Engine (Data processing + APIs)
- 🐳 Deployment → Docker Compose (or Vercel + Render)

---

### 📁 Working in Development Mode

During development:

- Frontend runs separately on Vite dev server
- Backend runs as Flask API server
- Both communicate via REST APIs

---

### 🔐 Environment Configuration
Make sure to configure environment variables:

- Backend: `.env` (Flask + GEE credentials)
- Frontend: `.env` (API base URL)

---

### 💡 Recommended Workflow
- Use Quick Start for running the project
- Use this section only when:
  - modifying code
  - adding features
  - debugging backend/frontend separately

## 👥 Contributing

Contributions are welcome and greatly appreciated! 🚀

Follow these steps to contribute:

1. 🍴 **Fork** the repository on GitHub  
2. 📥 **Clone your fork**
   ```bash
   git clone https://github.com/swetasingh08/uhi-dashboard.git
   ```
3. 🌿 Create a new branch
   ```bash
   git checkout -b feature/your-feature
   ```
4. 💾 Commit your changes
   ```bash
   git commit -m "feat: add your feature"
   ```
5. ⬆️ Push to your branch
   ```bash
   git push origin feature/your-feature
   ```
6.🔁 Open a Pull Request on the original repository

Please follow the existing code style and include tests for new behavior where applicable.

## 📜 License

This project is licensed under the **MIT** License.

<div align="center">

### ⭐ Don't forget to star this repo if you found it helpful! ⭐

</div>


