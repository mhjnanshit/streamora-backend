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
```
2. **Create a .env file at the root with the following variables:**

```bash
PORT=5000
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```
3. **Run the development server**

```bash
npm run dev
```

Server runs at http://localhost:8000

## 📫 API Testing

**Test all endpoints using Postman:**
**[Postman Collection Link](https://www.postman.com/your-collection-link)**

**Endpoints included:**
- User registration and login
- Video uploads, publishing, fetching, and deleting
- Playlist management
- Likes, comments, and subscriptions
- Watch history


## 📂 Folder Structure

```bash
src/
├─ controllers/   # Route handlers
├─ models/        # MongoDB schemas
├─ routes/        # API routes
├─ middleware/    # Authentication & error handling
├─ utils/         # Helpers, Cloudinary integration, API responses
└─ index.js       # Server entry point
```

## ✅ Notes & Best Practices

- Use JSON body for endpoints that accept textual data.
- Use multipart/form-data for file uploads (videos & thumbnails).
- All ObjectIds are validated before processing to avoid errors.
- Proper error handling is implemented with consistent API response format.
- Aggregated endpoints provide additional info like owner details, likes, and subscription status.

## 👨‍💻 Author

**Anshit Mahajan***
- ***GitHub: https://github.com/mhjnanshit***
- ***Email: mahajananshit0@gmail.com***

   



