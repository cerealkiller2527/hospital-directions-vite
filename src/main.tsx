import React from "react"
import ReactDOM from "react-dom/client"
import mapboxgl from 'mapbox-gl' // Mapbox GL JS library
import 'mapbox-gl/dist/mapbox-gl.css' // Mapbox GL JS styles
import App from "./App.tsx"
import "./index.css"
import { MAPBOX_WORKER_COUNT } from './lib/constants' // Worker count configuration

// Configure Mapbox GL JS worker count for better performance
mapboxgl.workerCount = MAPBOX_WORKER_COUNT;

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
)
