# 🍱 Home Cook Orders Platform

A simple full-stack web app that helps home cooks manage food orders efficiently — built for a time-limited hackathon.

---

## 🚀 Features

### 👩‍🍳 Cook Dashboard

* Add menu items (name, price, portions, cutoff time)
* View all customer orders
* View **prep list** (total items to cook)
* Mark orders as delivered

### 👤 Customer Side

* Browse available menu items
* Place orders with name & phone
* Real-time stock updates

---

## ⚙️ Core Logic

* Orders automatically **reduce available portions**
* Orders are **blocked after cutoff time**
* Items show **"Sold Out"** when portions reach zero
* Prep list uses aggregation (SUM of quantities)

---

## 🛠️ Tech Stack

* **Backend:** Python + Flask
* **Database:** SQLite
* **Frontend:** HTML, CSS, JavaScript

---

## 📂 Project Structure

```
project/
├── backend/
├── frontend/
└── README.md
```

---

## ▶️ How to Run

1. Install dependencies:

```
pip install flask
```

2. Run the server:

```
python app.py
```

3. Open in browser:

```
http://localhost:5000
```

---

## 💡 Future Improvements

* Payment integration
* User authentication
* Live order tracking

---

## 🏁 Hackathon Note

Built within a limited time to demonstrate:

* Full-stack development
* Real-time database operations
* Practical problem-solving

---
