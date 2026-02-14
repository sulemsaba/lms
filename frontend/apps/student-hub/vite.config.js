import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => {
  if (command === "serve") {
    throw new Error(
      "frontend/apps/student-hub is deprecated and dev startup is disabled. Use `cd frontend && npm run dev`."
    );
  }

  return {
    plugins: [react()],
    server: {
      fs: {
        allow: ["../.."]
      }
    }
  };
});
