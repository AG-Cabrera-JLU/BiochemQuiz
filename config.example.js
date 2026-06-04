// ============================================================
// BiochemQuiz — Firebase Configuration
// ============================================================
// SETUP INSTRUCTIONS:
//
// 1. Go to https://console.firebase.google.com
// 2. Click "Add project" and follow the steps (free Spark plan is enough)
// 3. In your project, click "Add app" → choose Web (</>)
// 4. Register the app (no need for Firebase Hosting)
// 5. Copy your firebaseConfig values below
// 6. In Firebase console → Build → Realtime Database → Create database
//    Choose "Start in test mode" for development
// 7. Copy THIS file to config.js and fill in your values
//    (config.js is in .gitignore — never commit your real keys)
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
