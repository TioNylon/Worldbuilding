import { createRoot } from "react-dom/client";
import { ErrorBoundary, Root } from "./app.jsx";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary><Root /></ErrorBoundary>
);
