# LogLens AI

LogLens AI is a FastAPI-based microservice that handles AI-powered log analysis and chat capabilities for the LogLens platform using the Groq LLM.

## How to Run the Project

You can run this service either locally (for active development) or via Docker (for a fully isolated environment).

### Option 1: Running with Docker (Recommended)

When using Docker, **you do NOT need to activate a virtual environment (`venv`)** or install any dependencies locally. Docker handles everything inside an isolated container.

1. Make sure Docker is running on your machine.
2. Ensure you have copied `.env.example` to `.env` and added your `GROQ_API_KEY`.
3. Start the service:
   ```bash
   docker-compose up --build
   ```
4. The service will be available at: **http://localhost:8000**
5. You can view the interactive API documentation at: **http://localhost:8000/docs**

### Option 2: Running Locally (Without Docker)

If you prefer to run the app directly on your machine without Docker, you will need to use the virtual environment.

1. Activate your virtual environment:
   ```bash
   source venv/bin/activate
   ```
2. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the application:
   ```bash
   uvicorn app.main:app --reload
   ```
4. The service will be available at: **http://localhost:8000**

## Project Structure
- `app/` - Main application code
  - `api/` - API routes (chat, analysis, health)
  - `config/` - Configuration settings
  - `core/` - Core logic and exceptions
  - `middleware/` - Custom middleware
  - `schemas/` - Pydantic models
  - `services/` - Business logic and external API integrations
- `tests/` - Unit and integration tests
