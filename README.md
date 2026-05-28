# ☕ Cafe Zing: Smart Canteen Management

> A high-concurrency canteen management system utilizing distributed task queues and Optical Character Recognition (OCR) to handle peak load ordering.

**[Insert a GIF of the app running, or a screenshot of the terminal processing the Redis queue here]**

## 🏗️ System Architecture
Cafe Zing was built to solve the problem of overwhelming lunch-hour traffic by offloading order processing to a background queue, preventing the main server from crashing.

* **Backend:** FastAPI (Python)
* **Queue Management:** Redis
* **Data Processing:** Tesseract  

## ✨ Core Features
* **Distributed Task Queues:** Implemented Redis to handle asynchronous order processing, ensuring the system remains responsive during peak load.
* **Automated Menu Digitization:** Integrated Tesseract to scan physical canteen menus and automatically convert them into structured database entries.
* **Real-Time Order Tracking:** Managed state across the application to give users instant feedback on their order status.

## 🚀 How to Run Locally

1. Clone the repository:
   `git clone https://github.com/JishnuNair2005/cafe-zing.git`
2. Install dependencies:
   `pip install -r requirements.txt`
3. Ensure Redis is running locally:
   `redis-server`
4. Start the FastAPI server:
   `uvicorn main:app --reload`
