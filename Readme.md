# 🎬 Streamora - Video Platform Backend

**Streamora** is a scalable, full-featured backend for a YouTube-like video content platform. It supports user authentication, video uploads, playlist management, likes, comments, subscriptions, and watch history tracking, built using modern backend technologies and best practices.

---

## 🚀 Features

- **Authentication & Authorization**
  - User registration and login with JWT tokens
  - Password hashing with bcrypt for secure storage
  - Middleware to protect private routes

- **Video Management**
  - Upload videos and thumbnails using **Cloudinary**
  - Publish, unpublish, and manage videos
  - Automatic video duration extraction
  - Track video views

- **Playlist Management**
  - Create, update, and delete playlists
  - Add/remove videos from playlists
  - Fetch playlists with aggregated video info

- **User Interactions**
  - Like and comment on videos
  - Track watch history
  - Subscribe to channels and check subscription status

- **Data Aggregation**
  - Fetch video details with likes, owner info, and subscription status
  - Fetch playlists with total views and total videos
  - Paginated comments and liked videos endpoints

- **RESTful API**
  - Fully tested using **Postman**
  - Proper validation, error handling, and consistent API response format

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB with Mongoose  
- **File Storage:** Cloudinary + Multer  
- **Authentication:** JWT & bcrypt  
- **Testing:** Postman  

---

## ⚙️ Setup & Installation

1. **Clone the repository**

```bash
git clone <repo-link>
cd streamora
npm install



