# Analyzr Frontend (Executive Interface)

The frontend is a high-fidelity React application built with TypeScript and Vite. It provides a premium, interactive interface for data exploration and AI communication.

## 🛠️ Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (High-Minimalist Design System)
- **State Management**: Zustand / Custom Stores
- **API Client**: Axios

## 📂 Architecture
- `/components`: Reusable UI elements (ChatBubble, ResultsPage, AnalysisLoader).
- `/pages`: Main view logic (UploadPage).
- `/lib`: API clients, types, and utility functions.
- `/assets`: Brand logos and static media.

## 🎨 Design System
The interface uses a strict "Luxury Data" aesthetic:
- **Glassmorphism**: Subtle blurs and semi-transparent layers.
- **Typography**: Inter / Sans-serif hierarchy.
- **Micro-animations**: Smooth transitions for loading states and chat bubbles.
- **Golden Accents**: Used sparingly for executive emphasis.

## 🚀 Running Locally
```bash
npm install
npm run dev
```
The frontend expects the backend to be running on `http://localhost:8000` (proxied via `vite.config.ts`).
