import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from './App';
import { initGoogleMapsApi } from "./lib/env";
import "./index.css";
import "./styles/dashboard-enhancements.css";
import "./styles/member-dashboard.css";

// Apply dark mode class based on preferences
// Check local storage first, then system preference
const applyDarkModeClass = () => {
  // Check if dark mode is forced via a localStorage setting
  const storedTheme = localStorage.getItem('theme');
  
  if (storedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (storedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // Check system preference if no storage preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
    
    // Add listener for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      if (event.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }
};

// Initialize dark mode
applyDarkModeClass();

// Initialize Google Maps API
initGoogleMapsApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App/>
    </QueryClientProvider>
  </StrictMode>,
);
