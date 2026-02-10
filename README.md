# Smart QR Code Attendance System

A modern, SaaS-style attendance management system.

## Setup Instructions

1. **Clone/Download** the repository.
2. **Setup Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Enable Email/Password Auth.
   - Setup Cloud Firestore.
   - Put your config in `src/lib/firebase.js`.
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Features
- Dynamic QR Generation (Teacher)
- Mobile-Friendly Scan (Student)
- Real-time Firestore Updates
- Role-based Protected Routes
- Professional Analytics Charts
- Excel Report Export
