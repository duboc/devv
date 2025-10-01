# Generative AI Developer Demos

This repository contains a collection of developer-focused demos showcasing the power of generative AI, specifically Google's Gemini models, in various software development tasks. The application is built with Flask and provides a modular architecture for adding new demos easily.

## Features

The application includes the following demos:

*   **User Story to Data:** Generates a database schema and BigQuery implementation from a user story.
*   **User Story to Code:** Generates application code and unit tests from a user story.
*   **User Story to API:** Generates an OpenAPI specification and Apigee proxy from a user story.
*   **Image to Code:** Generates code and test plans from an image of a UI mockup.
*   **Repo Inspection:** Performs various analyses on a GitHub repository.
*   **Repo Cache Analysis:** A more advanced version of Repo Inspection that uses Vertex AI's caching feature to speed up analysis and reduce costs.
*   **Accessibility:** Analyzes a web page for accessibility issues and generates a report.

## Technologies Used

*   **Backend:** Python, Flask
*   **Frontend:** HTML, CSS, JavaScript
*   **Generative AI:** Google Vertex AI (Gemini models)
*   **Libraries:**
    *   `google-cloud-aiplatform`
    *   `python-dotenv`
    *   `magika`
    *   `GitPython`

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/duboc/devv.git
    cd devv
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up your environment variables:**
    Create a `.env` file in the root of the project and add your Google Cloud project ID:
    ```
    GCP_PROJECT="your-gcp-project-id"
    ```

5.  **Authenticate with Google Cloud:**
    ```bash
    gcloud auth application-default login
    ```

## Usage

To run the application, execute the following command from the root of the project:

```bash
python app.py
```

The application will be available at `http://127.0.0.1:5001`.

## Project Structure

The project is organized into a modular structure using Flask Blueprints. Each application is a self-contained module located in the `apps/` directory.

```
.
├── apps/
│   ├── [app_name]/
│   │   ├── __init__.py         # Blueprint definition
│   │   ├── routes.py           # Application routes
│   │   └── templates/
│   │       └── [app_name].html # Application template
├── static/
│   ├── css/
│   └── js/
├── templates/
│   └── layout.html             # Main layout
├── .env                        # Environment variables
├── app.py                      # Main Flask application
└── requirements.txt            # Python dependencies
```

## Adding New Applications

To add a new application, follow these steps:

1.  **Create a new application module** in the `apps/` directory, following the structure described above.
2.  **Define a new Blueprint** in the `__init__.py` file of your application module.
3.  **Create the routes** for your application in the `routes.py` file.
4.  **Create the HTML template** for your application in the `templates/` directory.
5.  **Register the new blueprint** in the main `app.py` file.
6.  **Add a link to the new application** in the navigation menu in `templates/layout.html`.
7.  **Add the JavaScript logic** for the new application in `static/js/main.js`.

For more detailed instructions, refer to the `systemPatterns.md` file in the `memory-bank/` directory.
