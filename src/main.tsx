import React from "react"
import ReactDOM from "react-dom/client"
import mapboxgl from 'mapbox-gl'; // Import mapboxgl
import 'mapbox-gl/dist/mapbox-gl.css'; // Import Mapbox CSS
import App from "./App.tsx"
// import TestApp from "./TestApp.tsx" // Remove TestApp import
import "./index.css"
import { ThemeProvider } from "./components/theme-provider"

// Increase worker count before initializing any map
mapboxgl.workerCount = 4;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      {/* Render the main App component */}
      <App />
      {/* <TestApp /> */}
    </ThemeProvider>
  </React.StrictMode>,
)
