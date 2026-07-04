import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { HomeScreen } from "./src/screens/home-screen";
import { LoginScreen } from "./src/screens/login-screen";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <SafeAreaProvider>
      {isLoggedIn ? (
        <HomeScreen onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      )}
    </SafeAreaProvider>
  );
}
