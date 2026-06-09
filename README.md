# Analyzr: Autonomous AI Data Analyst

Analyzr is an enterprise-grade autonomous data science platform that transforms raw datasets into executive intelligence. Built with a high-minimalist aesthetic (**Pure Black, Pure White, and Metallic Gold**), it combines robust statistical analysis with the Leela AI engine to generate deep, multi-layered business insights.

## 🚀 Key Features

- **Multi-Dataset Ingestion**: Support for simultaneous uploading of multiple CSV/Excel files with automatic schema detection and data type inference.
- **Layered Analytical Intelligence**:
  - **Descriptive**: Distribution analysis, outlier detection, and statistical profiling.
  - **Diagnostic**: Correlation matrices, multicollinearity detection, and hypothesis testing.
  - **Predictive**: Automatic target variable suggestion and model feasibility analysis.
  - **Strategic**: KPI extraction, Pareto analysis, and business growth computation.
- **Leela AI Engine**: Integrated LLM (Mistral 7B via Ollama) for narrative synthesis, risk explanation, and proactive recommendations.
- **Visualization Intelligence**: Automatically generates high-contrast diagnostic charts with structured metadata for AI interpretation.
- **Conversational Analytics**: Multi-turn, context-aware chatbot for deep-diving into data insights and "Why" reasoning.
- **Professional Export**: Generate branded, executive-quality reports in PDF, HTML, and JSON formats.

## 🏗️ Architecture

```bash
Analyzr/
├── backend/    # FastAPI + Leela AI Engine (Python)
├── frontend/   # React + Vite (TypeScript)
└── .gitignore  # Repository configuration
```

## 🛠️ Quick Start

### Prerequisites

- [uv](https://github.com/astral-sh/uv) (Modern Python package manager)
- [Ollama](https://ollama.ai/) with the `mistral` model installed.
- [Node.js](https://nodejs.org/) & `npm`

### 1. Backend Setup

```bash
cd backend
uv run uvicorn main:app --reload
```

The backend initializes the Leela AI engine and handles data ingestion, processing, and session management.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend provides a clinical, authoritative interface for interacting with your data and AI analyst.

## 🎨 Aesthetics & Design

Analyzr follows a **Strict High-Minimalism** design system:

- **Core Palette**:
  - `Pure Black (#000000)`
  - `Pure White (#ffffff)`
  - `Orange (#d4af37)`
- **Identity**: Clinical, authoritative, and data-centric.
- **Visuals**: "Monalisa style" charts with high-contrast palettes for maximum legibility and professional impact.

---

_Built for Executive Decision Intelligence._
