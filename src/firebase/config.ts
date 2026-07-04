import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";

let missingConfigWarningShown = false;

const requiredFirebaseEnv = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
] as const;

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export function getMissingFirebaseEnvVars() {
  return requiredFirebaseEnv.filter((envName) => !process.env[envName]);
}

export function isFirebaseConfigured() {
  return getMissingFirebaseEnvVars().length === 0;
}

function warnMissingFirebaseConfig() {
  if (missingConfigWarningShown || isFirebaseConfigured()) {
    return;
  }

  missingConfigWarningShown = true;
  console.warn(
    "Firebase sem credenciais completas. O app continua em modo teste/memoria; preencha EXPO_PUBLIC_FIREBASE_* no .env para ativar a Fase 2."
  );
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    warnMissingFirebaseConfig();
    throw new Error(
      `Firebase sem credenciais completas. Variaveis ausentes: ${getMissingFirebaseEnvVars().join(", ")}`
    );
  }

  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export default firebaseConfig;
