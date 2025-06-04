import express, { type Express } from "express";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  log("Vite setup temporarily disabled - using static file serving");
  // Temporary bypass - vite setup disabled due to dependency issues
}

export function serveStatic(app: Express) {
  log("Static file serving temporarily disabled");
  // Temporary bypass - static serving disabled due to dependency issues
}