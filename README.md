# Dealerships Review & Inventory Management System

**IBM Full-Stack Software Developer Capstone Project**  
*Author:* Samarth Pawar ([@codebysamarth](https://github.com/codebysamarth))

---

## Project Overview

The **Dealerships Review & Inventory Management Web Application** is a multi-tier, full-stack platform developed for a national car retailer with dealership networks across the United States. The system allows prospective buyers and automotive enthusiasts to explore dealership branches across different states, inspect vehicle inventory and car models, read verified customer reviews, analyze customer review sentiments using natural language processing (NLP), and submit authentic reviews.

---

## Architectural Overview & Tech Stack

```text
+-----------------------------------------------------------------------------------+
|                                  USER BROWSER                                     |
|           React Components (Dealers, Dealer Details, Review Submission)           |
|           Static HTML & CSS (Home, About Us, Contact Us)                          |
+-----------------------------------------------------------------------------------+
                                        |  HTTP Requests
                                        v
+-----------------------------------------------------------------------------------+
|                           DJANGO WEB APPLICATION (PORT 8000)                      |
|  * Proxy Controller & API Routing (/djangoapp/*)                                  |
|  * User Management & Authentication (Register, Login, Logout)                     |
|  * Relational Database (SQLite): CarMake & CarModel Models                        |
|  * Static File & Frontend Asset Serving                                           |
+-----------------------------------------------------------------------------------+
                  |                                              |
                  | Microservice Calls                           | Sentiment Analysis API
                  v                                              v
+------------------------------------+         +------------------------------------+
|  DEALERSHIP & REVIEWS SERVICE      |         |     SENTIMENT ANALYZER (FLASK)     |
|             (PORT 3030)            |         |             (PORT 5050)            |
|  * Node.js & Express API Server    |         |  * Python & Flask Microservice     |
|  * MongoDB Database & Seed Data    |         |  * NLTK VADER Sentiment Analysis   |
|  * Dealership Branches & Reviews   |         |  * Positive, Neutral, Negative     |
+------------------------------------+         +------------------------------------+
```

### Core Technologies
* **Frontend:** React 18, React Router v6, Bootstrap 5, HTML5/CSS3, JavaScript (ES6+).
* **Backend Application:** Python, Django 3.2+ / 5.x LTS, Django Authentication System, SQLite3.
* **Microservices:**
  * **Database Service:** Node.js, Express.js, MongoDB / Mongoose, Body-Parser, CORS.
  * **Sentiment Analysis:** Python, Flask, NLTK (Natural Language Toolkit) with VADER Lexicon.
* **DevOps & Cloud:** Docker, GitHub Actions (CI/CD workflows), IBM Cloud Code Engine container deployment.

---

## Core Application Endpoints

### 1. Authentication & User Management
* `POST /djangoapp/login` — Authenticate user and initiate session.
* `GET /djangoapp/logout` — Terminate session and clear session credentials.
* `POST /djangoapp/register` — Create new customer account with username, first name, last name, and email.

### 2. Vehicle Catalog & Inventory
* `GET /djangoapp/get_cars` — Retrieve all vehicle manufacturers (`CarMake`) and vehicle models (`CarModel`).

### 3. Dealership Branches & Customer Feedback
* `GET /djangoapp/get_dealers` — Retrieve all 50 dealership branches across the United States.
* `GET /djangoapp/get_dealers/<state>` — Filter dealership branches by specific US state (e.g., Kansas).
* `GET /djangoapp/dealer/<id>` — Retrieve comprehensive details for a specific dealership by identifier.
* `GET /djangoapp/reviews/dealer/<id>` — Retrieve all customer reviews for a dealership, enriched with automated sentiment evaluation.
* `POST /djangoapp/add_review` — Submit new vehicle review for an authorized customer session.

### 4. Microservices
* `GET http://localhost:3030/fetchDealers` — Microservice endpoint to retrieve all dealerships.
* `GET http://localhost:3030/fetchDealers/:state` — Microservice endpoint to retrieve dealerships by state.
* `GET http://localhost:3030/fetchDealer/:id` — Microservice endpoint to retrieve single dealership by ID.
* `GET http://localhost:3030/fetchReviews/dealer/:id` — Microservice endpoint to retrieve reviews.
* `POST http://localhost:3030/insert_review` — Microservice endpoint to insert a new review.
* `GET http://localhost:5050/analyze/<text>` — Microservice endpoint analyzing sentiment score of review text.

---

## Local Setup & Development Instructions

### Prerequisites
* Python 3.10+
* Node.js v18+ and npm
* Git

### 1. Clone Repository
```bash
git clone https://github.com/codebysamarth/xrwvm-fullstack_developer_capstone.git
cd xrwvm-fullstack_developer_capstone
```

### 2. Configure Python Virtual Environment & Install Dependencies
```bash
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r server/requirements.txt
pip install flask nltk
```

### 3. Initialize Django Database & Seed Data
```bash
python server/manage.py makemigrations djangoapp
python server/manage.py migrate
python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoproj.settings'); import sys; sys.path.insert(0, 'server'); django.setup(); from djangoapp.populate import initiate; initiate()"
```

### 4. Build Frontend Application
```bash
cd server/frontend
npm install
npm run build
cd ../..
```

### 5. Launch Backend Microservices & Django Application
* **Node.js Dealership Microservice:**
  ```bash
  cd server/database
  npm install
  node app.js
  ```
* **Flask Sentiment Analyzer:**
  ```bash
  python server/djangoapp/microservices/app.py
  ```
* **Django Main Application:**
  ```bash
  python server/manage.py runserver 8000
  ```

---

## License

This project is licensed under the Apache 2.0 License.
