# Technical Context

## 1. Core Technologies

- **Backend Framework:** Flask
- **Frontend:** Standard HTML, CSS, and JavaScript. No complex frontend framework is required at this stage.
- **Language:** Python 3

## 2. Key Python Libraries

- **`Flask`**: The core web framework.
- **`google-cloud-aiplatform`**: For making calls to the Vertex AI/Gemini models.
- **`python-dotenv`**: To manage environment variables for API keys and other configurations.

## 3. External Services

- **Google Vertex AI:** The application relies on this service for its core generative AI capabilities. The specific models used are `gemini-experimental`, `gemini-1.5-pro-001`, and `gemini-1.5-flash-001`.

## 4. Development Environment

- A standard Python environment with `pip` for package management.
- A `.env` file will be used to store sensitive information like API keys.
