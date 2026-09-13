import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import App from "./App";
import "./styles.css";

function render() {
  const element = document.getElementById("root");
  if (!element) throw new Error("Không tìm thấy root element.");

  createRoot(element).render(
    <StrictMode>
      <FluentProvider theme={webLightTheme}>
        <App />
      </FluentProvider>
    </StrictMode>
  );
}

if (typeof Office !== "undefined") {
  Office.onReady(() => render());
} else {
  render();
}
