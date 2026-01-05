import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers } from "./lib/errorLogger";

// Set up global error handlers for monitoring
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
