import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

console.warn("--- SMART-QR APP STARTUP ---");
console.log("Time:", new Date().toLocaleTimeString());
console.log("Root element exists:", !!document.getElementById('root'));
console.log("Vite Context:", import.meta.env.MODE);

ReactDOM.createRoot(document.getElementById('root')).render(
    <>
        <App />
        <Toaster position="top-right" />
    </>,
)
