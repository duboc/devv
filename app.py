from flask import Flask, render_template
from dotenv import load_dotenv
import os
import vertexai

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__, template_folder='templates')

    # Initialize Vertex AI
    try:
        project_id = os.getenv('GCP_PROJECT')
        location = "us-central1"
        if project_id:
            vertexai.init(project=project_id, location=location)
            app.config['VERTEXAI_INITIALIZED'] = True
        else:
            app.config['VERTEXAI_INITIALIZED'] = False
            print("Warning: GCP_PROJECT not set. Some features may not work.")
    except Exception as e:
        app.config['VERTEXAI_INITIALIZED'] = False
        print(f"Warning: Could not initialize Vertex AI. {e}")


    # Register blueprints
    from apps.story_to_data import story_to_data_bp
    app.register_blueprint(story_to_data_bp)

    from apps.story_to_code import story_to_code_bp
    app.register_blueprint(story_to_code_bp)

    from apps.story_to_api import story_to_api_bp
    app.register_blueprint(story_to_api_bp)

    from apps.image_to_code import image_to_code_bp
    app.register_blueprint(image_to_code_bp)

    from apps.accessibility import accessibility_bp
    app.register_blueprint(accessibility_bp)

    from apps.repo_inspection import repo_inspection_bp
    app.register_blueprint(repo_inspection_bp)

    from apps.repo_cache_analysis import repo_cache_analysis_bp
    app.register_blueprint(repo_cache_analysis_bp)

    @app.route('/')
    def index():
        # This now renders the main layout, and JS handles the rest
        return render_template('layout.html')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5001)
