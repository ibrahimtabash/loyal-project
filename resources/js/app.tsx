import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import "../css/app.css";
import "../css/loyalty.css";

createInertiaApp({
  title: (title) => `${title} | رِجعة`,
  resolve: (name) =>
    resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob("./pages/**/*.tsx")),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
  progress: { color: "#a5b591" },
});
