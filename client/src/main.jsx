import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext";

try {
  const savedTheme = localStorage.getItem("sra_theme") || "dark";
  document.documentElement.classList.toggle("dark", savedTheme === "dark");
  document.documentElement.dataset.theme = savedTheme;
} catch {
  document.documentElement.classList.add("dark");
}

// Development-only: capture global errors so automated checks return stack traces
if (import.meta.env.MODE !== "production") {
  window.addEventListener("error", (ev) => {
    console.error(
      "Global error caught:",
      ev.message,
      ev.error && ev.error.stack,
    );
  });
  window.addEventListener("unhandledrejection", (ev) => {
    console.error(
      "Unhandled rejection:",
      ev.reason && ev.reason.stack ? ev.reason.stack : ev.reason,
    );
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
