import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, type Auth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    app = initializeApp(firebaseConfig);
  }
  return app;
}

function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(getFirebaseApp());
  }
  return _storage;
}

export function setupRecaptcha(elementId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth();
  const verifier = new RecaptchaVerifier(auth, elementId, {
    size: "invisible",
    callback: () => {},
  });
  return verifier;
}

export async function sendOtp(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  const fullNumber = `+91${phoneNumber}`;
  return signInWithPhoneNumber(auth, fullNumber, recaptchaVerifier);
}

export async function compressAndUploadImage(file: File, path: string, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<string> {
  const storage = getFirebaseStorage();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return reject(new Error("Failed to compress image"));
            try {
              const storageRef = ref(storage, path);
              await uploadBytes(storageRef, blob);
              const url = await getDownloadURL(storageRef);
              resolve(url);
            } catch (err) {
              reject(err);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
