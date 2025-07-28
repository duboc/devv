# Project Brief: Streamlit to Flask Migration

## 1. Project Goal

The primary objective of this project is to migrate an existing Streamlit application to a Flask web application. The goal is to retain all core functionality of the original application while leveraging the flexibility, scalability, and production-readiness of the Flask framework.

## 2. Core Functionality to Retain

The Flask application must replicate the following features from the Streamlit version:

- **User Input and Configuration:** Allow users to select a model, industry, persona, and language.
- **Dynamic Content Generation:** Generate a user story, tasks, data warehouse (DW) schema, and BigQuery implementation based on user inputs.
- **Sequential Workflow:** The UI should guide the user through a 4-step process, where each step depends on the completion of the previous one.
- **Display Results:** All generated content (user story, tasks, DW, BigQuery) must be displayed to the user.

## 3. Key Technical Requirements

- **Backend:** Python with Flask.
- **Frontend:** HTML, CSS, and JavaScript for user interaction.
- **Dependencies:** The application will continue to use the `google-cloud-aiplatform` for interacting with Vertex AI models.
- **Structure:** The project should be well-structured, separating backend logic, frontend templates, and static files.
