"use client";

import { useState, useEffect } from "react";
import AuthScreen from "@/components/AuthScreen";
import HomeScreen from "@/components/HomeScreen";

export default function Page() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("currentUser");
    if (user) {
      Promise.resolve().then(() => setCurrentUser(JSON.parse(user)));
    }
    Promise.resolve().then(() => setIsLoading(false));
  }, []);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
  };

  const handleUpdateUser = (updatedUser: any) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {currentUser ? (
        <HomeScreen user={currentUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
      ) : (
        <AuthScreen onLogin={handleLogin} />
      )}
    </main>
  );
}
