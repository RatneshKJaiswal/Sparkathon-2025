# Sparkathon-2025

# Renewable Energy Utilization Optimizer

Maximizing renewable energy utilization for cost savings and environmental impact.

## 🚀 Overview

This project addresses the critical problem of **sub-optimal renewable energy utilization at Walmart stores**. Despite significant investments in renewable energy, challenges persist in maximizing its usage, resulting in missed cost savings and environmental benefits.

Our solution is an **ML-powered dashboard** that provides **actionable insights**, enabling Walmart to efficiently manage its diverse energy resources.

---

## 🛠️ Solution Architecture

### 1️⃣ Robust Data Ingestion and Storage 📊

**Challenge:**  
Walmart’s large-scale operations generate vast amounts of energy data (consumption, solar generation, grid prices) that require efficient organization and access.

**Solution:**  
- **Scalable Data Lake:** Built on **AWS S3**, partitioned for efficient querying.
- **Real-Time Data Ingestion:** Synthetic data ingested hourly using **AWS Lambda** triggered by **Amazon EventBridge**.
- **Purpose:** Provides a constantly updated dataset for analytics and forecasting.

**Tech Stack:**  
`AWS S3`, `AWS Lambda`, `Amazon EventBridge`

---

### 2️⃣ Intelligent Machine Learning for Forecasting & Optimization 🧠

**Challenge:**  
Without predictive foresight, energy decisions are reactive and inefficient.

**Solution:**  
- **Forecasting Models:**  
  - Predict future **energy consumption** and **solar generation** using **time-series forecasting** powered by **XGBoost**.
  - Inputs include HVAC, refrigeration, lighting, battery usage, time of day/week, etc.
- **Optimization Algorithm:**  
  - Uses forecasted and real-time data to recommend optimal energy mixes (solar, battery, grid).  
  - Example Recommendation: _"Pre-cool the store using solar before peak demand."_

**Tech Stack:**  
`Python`, `Pandas`, `Scikit-learn`, `XGBoost`, `NumPy`

---

### 3️⃣ High-Performance Backend API 📡

**Challenge:**  
Need a scalable and efficient method to expose ML-powered intelligence to the dashboard.

**Solution:**  
- **FastAPI** serves as the backend API:
  - Loads ML models for forecasts and optimization.
  - Provides endpoints for real-time metrics, forecasts, recommendations, and historical data querying.
- **Deployment:** Hosted on **Railway.com** using **Docker** containers for consistency.

**Tech Stack:**  
`FastAPI`, `Docker`, `boto3 (for AWS S3 interaction)`

---

### 4️⃣ Intuitive User Interface (Dashboard) 🖥️

**Challenge:**  
Store managers need clear, actionable insights presented visually for informed decisions.

**Solution:**  
- **Frontend Dashboard:**
  - Built with **Next.js** and **TypeScript**.
  - Features real-time energy consumption breakdown, interactive forecasts, optimization recommendations, and historical data.
  - Fully responsive and interactive UI.

**Tech Stack:**  
`Next.js`, `TypeScript`, `React`, `Tailwind CSS`, `Recharts`

---

## 🏗️ System Architecture Diagram


---

## 📦 Deployment Overview

| Component                 | Technology               | Hosting            |
|---------------------------|--------------------------|--------------------|
| Data Lake                 | AWS S3                   | AWS                |
| Data Pipeline             | AWS Lambda + EventBridge | AWS                | 
| Backend API + ML Model    | FastAPI + Docker         | Railway            |
| Frontend UI               | Next.js + Tailwind       | Vercel             |

---

## ⚙️ Key Features

- ✅ Real-time renewable energy utilization display
- ✅ Predictive energy forecasting
- ✅ Intelligent optimization recommendations
- ✅ Visualization of historical energy data
- ✅ Fully responsive, interactive web interface

---

## 📚 Future Enhancements

- Integration with real-time IoT sensor data from actual Walmart stores
- Advanced optimization algorithms (e.g., Reinforcement Learning)
- Cost savings estimation module
- Authentication & Role-based access control (RBAC)

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

## 📄 License

[MIT License](LICENSE)

---

## ✨ Authors

- **Ratnesh Kumar Jaiswal**
- Contact: ratnesh.kr.jais@gmail.com | [LinkedIn](https://www.linkedin.com/in/ratnesh-kumar-jaiswal/)

