import React from "react";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "@xyflow/react/dist/style.css";
  import "./app/flowTheme.css";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  