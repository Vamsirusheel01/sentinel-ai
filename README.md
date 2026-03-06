# 🔐 SentinelAI  
### Zero-Trust Endpoint Security with Dynamic Trust Scoring

SentinelAI is a **prototype Endpoint Detection & Response (EDR) system** that continuously monitors endpoint behavior and dynamically evaluates system trust using behavioral analysis.

The system detects suspicious activity such as **malicious processes, privilege escalation attempts, abnormal command execution, and suspicious network behavior**, then reduces the **trust score** of the endpoint accordingly.

When the trust score drops below a threshold, the system can trigger **alerts and automated isolation mechanisms**.

---

# 🎯 Project Objective

Traditional security systems rely on **static rules or signature-based detection**.
SentinelAI follows a **Zero Trust Security Model**, where:
> Every device is continuously verified based on its behavior.
Instead of assuming a device is safe after authentication, SentinelAI constantly evaluates system activity and dynamically updates a **trust score**.

---

## 🚀 Features
- Device Authentication
- Dynamic Trust Score
- Endpoint Monitoring
- Threat Detection
- Admin Dashboard

## 🛠 Tech Stack
- Backend: Flask / FastAPI
- Database: MongoDB / Firebase
- Agent: Python
- Frontend: HTML/CSS/JS
- AI: Scikit-learn

## 👥 Team
- **Backend & Detection Engine**: Vamsi Pochampally
- **Backend & Detection Engine**: Baddula Pavan Kumar 

## 📌 How to Run
```bash
pip install -r requirements.txt
python app.py

## Start Frontend Dashboard
```bash
npm install
npm start
