import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";

const requestedTheme = new URLSearchParams(window.location.search).get('theme');
const defaultTheme = requestedTheme === 'light' ? 'light' : 'dark';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme={defaultTheme} storageKey="afterglow-design-system-theme" enableSystem={false}>
    <App />
  </ThemeProvider>,
);
