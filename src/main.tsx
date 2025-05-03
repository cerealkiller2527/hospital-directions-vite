import React from "react"
import ReactDOM from "react-dom/client"
import mapboxgl from 'mapbox-gl'; // Import mapboxgl
import 'mapbox-gl/dist/mapbox-gl.css'; // Import Mapbox CSS
import App from "./App.tsx"
// import TestApp from "./TestApp.tsx" // Remove TestApp import
import "./index.css"
// Remove ThemeProvider import
// import { ThemeProvider } from "./components/theme-provider"

// Increase worker count before initializing any map
mapboxgl.workerCount = 4;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Remove ThemeProvider wrapper */}
    {/* <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme"> */}
      <App />
    {/* </ThemeProvider> */}
  </React.StrictMode>,
)
