import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

declare const __firebase_config: string;
declare const __app_id: string;

const getCanvasConfig = () => {
  try {
    return typeof __firebase_config !== "undefined"
      ? JSON.parse(__firebase_config)
      : {
          apiKey: "AIzaSyCdgujm12Phca07r8lIkZ-Vu-ShA4_1ebY",
          authDomain: "fut-dos-salvos.firebaseapp.com",
          projectId: "fut-dos-salvos",
          storageBucket: "fut-dos-salvos.firebasestorage.app",
          messagingSenderId: "1015340809584",
          appId: "1:1015340809584:web:97f771bb9df23286bae3b5",
          measurementId: "G-CZN3CBZV9H",
        };
  } catch {
    return {
      apiKey: "AIzaSyCdgujm12Phca07r8lIkZ-Vu-ShA4_1ebY",
      authDomain: "fut-dos-salvos.firebaseapp.com",
      projectId: "fut-dos-salvos",
    };
  }
};

const firebaseConfig = getCanvasConfig();
export const appId =
  typeof __app_id !== "undefined" ? __app_id : "fut-dos-salvos";
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
