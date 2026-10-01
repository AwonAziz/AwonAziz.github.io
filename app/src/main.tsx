import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SmoothScrollProvider } from "@/providers/smooth-scroll";
import { App } from "./app";
// Lenis ships its own stylesheet: `html.lenis` gets the height and touch-action
// rules it needs, and importing it before our own CSS keeps our base layer able
// to override where they disagree.
import "lenis/dist/lenis.css";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <StrictMode>
    <SmoothScrollProvider>
      <App />
    </SmoothScrollProvider>
  </StrictMode>,
);
