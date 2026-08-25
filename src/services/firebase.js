import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAs81kYRb5pjpJs8vRVuJv9VvF-1bnj23k",
  authDomain: "wedding-planner-29900.firebaseapp.com",
  projectId: "wedding-planner-29900",
  storageBucket: "wedding-planner-29900.firebasestorage.app",
  messagingSenderId: "788880817741",
  appId: "1:788880817741:web:90447625fb12e86fa56604"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;