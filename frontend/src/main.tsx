import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
// Self-hosted fonts: icons must never fall back to raw ligature text offline.
import "material-symbols/rounded.css";
import "@fontsource-variable/plus-jakarta-sans";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
