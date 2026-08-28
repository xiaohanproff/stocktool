import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("根节点 #root 不存在");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
