import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Global error boundary defined in App.jsx via class component
createRoot(document.getElementById('root')).render(<App />)
