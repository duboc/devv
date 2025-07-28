from flask import render_template, request, jsonify
from . import image_to_code_bp
import os
import base64
from utils.utils_vertex import sendPrompt

# Load models from .env file
model_gemini_flash = os.getenv("MODEL_GEMINI_FLASH", "gemini-2.5-flash")
model_gemini_pro = os.getenv("MODEL_GEMINI_PRO", "gemini-2.5-pro")

@image_to_code_bp.route('/')
def image_to_code_index():
    try:
        use_cases = [
            "Sprint Planning",
            "Random Jokes Website", 
            "Test Plan Generation",
            "Custom Use Case"
        ]
        languages = ["English", "Portuguese", "Spanish"]
        models = [model_gemini_flash, model_gemini_pro]
        
        return render_template('image_to_code.html', 
                               use_cases=use_cases,
                               languages=languages,
                               models=models)
    except Exception as e:
        return f"Error: {str(e)}"

def load_models(model_name):
    return model_name

@image_to_code_bp.route('/generate/description', methods=['POST'])
def generate_description():
    data = request.json
    model = load_models(data['model_name'])
    
    use_case = data['use_case']
    language = data['story_lang']
    
    # Define prompts based on use case
    if use_case == "Sprint Planning":
        prompt = f"""
        All answers should be provided in {language}.
        Explain this login screen in the format of feature implementation for a user story.
        This description will be used for development backlog for frontend, backend, and Google Cloud deployment plan.
        """
    elif use_case == "Random Jokes Website":
        prompt = f"""
        All answers should be provided in {language}.
        Explain this napkin sketch in the format of feature implementation for a user story.
        The idea is a website for random jokes generated using Vertex AI with the gemini-1.5-flash-001 model.
        This description will be used for development backlog for frontend, backend, and Google Cloud deployment plan.
        """
    elif use_case == "Test Plan Generation":
        prompt = f"""
        All answers should be provided in {language}.
        Explain this login screen in the format of a test plan for a user story.
        This description will be used for development backlog.
        """
    else:  # Custom Use Case
        prompt = data.get('custom_prompt', f"""
        All answers should be provided in {language}.
        Analyze this image and provide a detailed description of its contents, focusing on potential development opportunities.
        Then, suggest potential applications or use cases for this image in the context of software development.
        """)
    
    # For now, we'll simulate the image analysis since we don't have multimodal setup
    # In a real implementation, you would use Vertex AI's multimodal model
    response_content = sendPrompt(prompt + "\n\n[Note: This is a text-only simulation. In production, this would analyze the uploaded image.]", model)
    
    return jsonify({'content': response_content, 'prompt': prompt})

@image_to_code_bp.route('/generate/backend', methods=['POST'])
def generate_backend():
    data = request.json
    model = load_models(data['model_name'])
    language = data['story_lang']
    
    prompt = f"""
    All answers should be provided in {language}.
    Use the image content and the generated description to create a backend implementation using Flask and Python for a planned sprint.
    Generated description:
    {data['description_content']}
    
    Create a complete Flask backend with:
    - Proper route structure
    - Database models if needed
    - API endpoints
    - Error handling
    - Security considerations
    """
    
    response_backend = sendPrompt(prompt, model)
    return jsonify({'content': response_backend, 'prompt': prompt})

@image_to_code_bp.route('/generate/frontend', methods=['POST'])
def generate_frontend():
    data = request.json
    model = load_models(data['model_name'])
    language = data['story_lang']
    
    prompt = f"""
    All answers should be provided in {language}.
    Use the image content and the backend code to implement the frontend for the application.
    Backend code:
    {data['backend_content']}
    
    Create a complete frontend with:
    - HTML structure
    - CSS styling
    - JavaScript functionality
    - Responsive design
    - Integration with backend API
    """
    
    response_frontend = sendPrompt(prompt, model)
    return jsonify({'content': response_frontend, 'prompt': prompt})

@image_to_code_bp.route('/generate/deployment', methods=['POST'])
def generate_deployment():
    data = request.json
    model = load_models(data['model_name'])
    language = data['story_lang']
    
    prompt = f"""
    All answers should be provided in {language}.
    Use the backend and frontend content to create the best deployment architecture for a stateless application.
    Use Cloud Run and choose an appropriate database based on the code. Use Google Cloud Storage for storing images if needed.
    The output should be a Terraform script following best practices.
    Backend code:
    {data['backend_content']}
    Frontend code:
    {data['frontend_content']}
    
    Create:
    - Terraform configuration files
    - Cloud Run deployment
    - Database setup (Cloud SQL or Firestore)
    - Storage bucket configuration
    - IAM permissions
    - Environment variables setup
    """
    
    response_deployment = sendPrompt(prompt, model)
    return jsonify({'content': response_deployment, 'prompt': prompt})

@image_to_code_bp.route('/generate/test_cases', methods=['POST'])
def generate_test_cases():
    data = request.json
    model = load_models(data['model_name'])
    language = data['story_lang']
    
    prompt = f"""
    All answers should be provided in {language}.
    Use the image content and the generated description to create test cases for a planned sprint.
    Generated description:
    {data['description_content']}
    
    Create comprehensive test cases including:
    - Functional test cases
    - UI/UX test cases
    - Integration test cases
    - Edge cases and error scenarios
    - Performance test considerations
    - Security test cases
    """
    
    response_test_cases = sendPrompt(prompt, model)
    return jsonify({'content': response_test_cases, 'prompt': prompt})

@image_to_code_bp.route('/generate/test_script', methods=['POST'])
def generate_test_script():
    data = request.json
    model = load_models(data['model_name'])
    language = data['story_lang']
    
    prompt = f"""
    All answers should be provided in {language}.
    Use the image content and the test plan to create scripts for testing during the planned sprint.
    Test plan:
    {data['test_cases_content']}
    
    Create test execution scripts with:
    - Python unittest framework
    - Test setup and teardown
    - Test data management
    - Assertion methods
    - Test reporting
    - CI/CD integration
    """
    
    response_test_script = sendPrompt(prompt, model)
    return jsonify({'content': response_test_script, 'prompt': prompt})

@image_to_code_bp.route('/generate/selenium', methods=['POST'])
def generate_selenium():
    data = request.json
    model = load_models(data['model_name'])
    language = data['story_lang']
    
    prompt = f"""
    All answers should be provided in {language}.
    Use the image content and the test plan to create a Selenium script to automate the tests.
    Test plan:
    {data['test_cases_content']}
    
    Create Selenium automation with:
    - WebDriver setup
    - Page Object Model pattern
    - Element locators
    - Wait strategies
    - Test data handling
    - Screenshot capture on failures
    - Parallel execution capabilities
    """
    
    response_selenium = sendPrompt(prompt, model)
    return jsonify({'content': response_selenium, 'prompt': prompt})

@image_to_code_bp.route('/upload_image', methods=['POST'])
def upload_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Convert image to base64 for frontend display
        image_data = file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        return jsonify({
            'success': True,
            'image_data': f"data:{file.content_type};base64,{image_base64}",
            'filename': file.filename
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
