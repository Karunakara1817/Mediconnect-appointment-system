<div align="center">

# 🩺 MediConnect
### Full-Stack Healthcare Appointment & Multi-Portal Management Platform

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Security-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

<p>
  <a href="#-architecture">Architecture</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-interactive-3d-interface">3D UI</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-api-endpoints">API Docs</a> •
  <a href="#-local-setup">Setup</a> •
  <a href="#-demo-accounts">Demo Accounts</a>
</p>

</div>

---

## 📌 Overview

**MediConnect** is a full-stack healthcare platform connecting **Patients**, **Verified Doctors**, and **Administrators** through a unified, role-secured ecosystem. Built across a Spring Boot REST API, a PostgreSQL relational database, a React + Vite frontend with interactive 3D visuals, and an independent Node.js notification microservice, it handles end-to-end appointment scheduling, doctor verification, and real-time status notifications.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    UI["React + Vite Frontend\n(Port 5173)\nInteractive 3D UI & Portals"]
    API["Spring Boot REST API\n(Port 8080)\nJWT Security & Business Logic"]
    DB[("PostgreSQL\nmediconnect_db")]
    NOTIFY["Node.js Notification Service\n(Port 5000)\nEvent Alerts"]

    UI <-->|"Axios + Bearer JWT"| API
    API <-->|"Spring Data JPA"| DB
    API -->|"REST Webhook"| NOTIFY
