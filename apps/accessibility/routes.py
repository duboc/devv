from flask import render_template, request, jsonify
from . import accessibility_bp
import os
from utils.utils_vertex import sendPrompt

# Load models from .env file
model_gemini_flash = os.getenv("MODEL_GEMINI_FLASH", "gemini-1.5-flash-001")
model_gemini_pro = os.getenv("MODEL_GEMINI_PRO", "gemini-1.5-pro-001")
model_gemini_experimental = "gemini-experimental"

@accessibility_bp.route('/')
def accessibility_index():
    try:
        use_cases = [
            "Retail (Nike)",
            "Pharmacy (Raia)"
        ]
        languages = ["English", "Portuguese", "Spanish"]
        models = [model_gemini_experimental, model_gemini_pro, model_gemini_flash]
        
        return render_template('accessibility.html', 
                               use_cases=use_cases,
                               languages=languages,
                               models=models)
    except Exception as e:
        return f"Error: {str(e)}"

def load_models(model_name):
    return model_name

@accessibility_bp.route('/generate/wcag_analysis', methods=['POST'])
def generate_wcag_analysis():
    data = request.json
    model = load_models(data['model_name'])
    
    use_case = data['use_case']
    language = data['story_lang']
    
    # Determine video URI based on use case
    if use_case == "Retail (Nike)":
        video_uri = "gs://convento-samples/nike-sbf.mp4"
        business_type = "Nike online store"
    else:
        video_uri = "gs://convento-samples/raia.mp4"
        business_type = "online pharmacy app"
    
    prompt = f"""All responses should be in {language}.
    Analyze the video of a user interacting with the {business_type}.
    Identify specific accessibility issues and improvement opportunities based on WCAG 2.1 guidelines.

    Key areas to evaluate:
    1. Perceivable: Information and user interface components must be presentable to users in ways they can perceive.
    2. Operable: User interface components and navigation must be operable.
    3. Understandable: Information and the operation of user interface must be understandable.
    4. Robust: Content must be robust enough that it can be interpreted by a wide variety of user agents, including assistive technologies.

    Provide a table with:
    Timestamp | WCAG Guideline | Issue Description | Conformance Level (A, AA, AAA) | Recommendation

    Follow with a concise summary of overall WCAG compliance strengths and weaknesses, and specific, actionable recommendations for improvement.
    
    Note: This is a simulated analysis. In production, this would analyze the actual video content from {video_uri}.
    """
    
    response_content = sendPrompt(prompt, model)
    
    return jsonify({
        'content': response_content, 
        'prompt': prompt,
        'video_uri': video_uri
    })

@accessibility_bp.route('/generate/user_stories', methods=['POST'])
def generate_user_stories():
    data = request.json
    model = load_models(data['model_name'])
    language = data['story_lang']
    wcag_analysis = data.get('wcag_analysis', '')
    
    if not wcag_analysis:
        return jsonify({'error': 'WCAG analysis is required to generate user stories'}), 400
    
    prompt = f"""All responses should be in {language}.
    Group similar accessibility issues from the WCAG analysis into user stories. Present in a table format.

    For each user story:
    1. Follow the format: "As a [type of user with specific accessibility needs], I want to [action] so that [benefit]."
    2. Prioritize based on the WCAG conformance level (A, AA, AAA).
    3. Include details about the accessibility issue and recommended solution.

    Table format:
    Priority | User Story | WCAG Guideline | Details (including issue and recommendation)

    WCAG Analysis:
    {wcag_analysis}
    """
    
    response_content = sendPrompt(prompt, model)
    
    return jsonify({
        'content': response_content,
        'prompt': prompt
    })

@accessibility_bp.route('/generate/implementation', methods=['POST'])
def generate_implementation():
    data = request.json
    model = load_models(data['model_name'])
    language = data['story_lang']
    user_stories = data.get('user_stories', '')
    
    if not user_stories:
        return jsonify({'error': 'User stories are required to generate implementation plan'}), 400
    
    prompt = f"""All responses should be in {language}.
    Create a detailed implementation plan for the accessibility user stories provided.

    For each user story, provide:
    1. Technical implementation details
    2. Code examples (HTML, CSS, JavaScript, ARIA attributes)
    3. Testing methods to verify accessibility compliance
    4. Priority and estimated effort
    5. Dependencies and prerequisites

    Format as a comprehensive implementation guide that developers can follow.

    User Stories:
    {user_stories}
    """
    
    response_content = sendPrompt(prompt, model)
    
    return jsonify({
        'content': response_content,
        'prompt': prompt
    })

@accessibility_bp.route('/generate/test_plan', methods=['POST'])
def generate_test_plan():
    data = request.json
    model = load_models(data['model_name'])
    language = data['story_lang']
    implementation = data.get('implementation', '')
    
    if not implementation:
        return jsonify({'error': 'Implementation plan is required to generate test plan'}), 400
    
    prompt = f"""All responses should be in {language}.
    Create a comprehensive accessibility testing plan based on the implementation details provided.

    Include:
    1. Automated testing tools and setup (axe-core, Lighthouse, etc.)
    2. Manual testing procedures
    3. Screen reader testing scenarios
    4. Keyboard navigation testing
    5. Color contrast and visual testing
    6. User testing with people with disabilities
    7. Compliance verification checklist for WCAG 2.1 AA

    Provide specific test cases, expected results, and acceptance criteria.

    Implementation Plan:
    {implementation}
    """
    
    response_content = sendPrompt(prompt, model)
    
    return jsonify({
        'content': response_content,
        'prompt': prompt
    })
