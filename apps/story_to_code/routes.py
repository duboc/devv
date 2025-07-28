from flask import render_template, request, jsonify
from . import story_to_code_bp
import os
from utils.utils_vertex import sendPrompt

# Load models from .env file
model_gemini_flash = os.getenv("MODEL_GEMINI_FLASH", "gemini-2.5-flash")
model_gemini_pro = os.getenv("MODEL_GEMINI_PRO", "gemini-2.5-pro")

def load_questions(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().splitlines()
    except FileNotFoundError:
        print(f"Warning: File not found: {file_path}. Falling back to English version.")
        english_file_path = file_path.replace('-es.txt', '-en.txt').replace('-pt.txt', '-en.txt')
        with open(english_file_path, 'r', encoding='utf-8') as f:
            return f.read().splitlines()

@story_to_code_bp.route('/')
def story_to_code_index():
    try:
        questions = load_questions('./data/retail-en.txt')
        industries = ["retail", "energy", "health", "finance", "beauty"]
        languages = ["English", "Portuguese", "Spanish"]
        models = [model_gemini_flash, model_gemini_pro]
        
        return render_template('story_to_code.html', 
                               questions=questions, 
                               industries=industries, 
                               languages=languages,
                               models=models)
    except Exception as e:
        return f"Error: {str(e)}"

def load_models(model_name):
    return model_name

@story_to_code_bp.route('/generate/story', methods=['POST'])
def generate_story():
    data = request.json
    model = load_models(data['model_name'])
    
    prompt = f"""Write a User story based on the following premise:
    persona_name: {data['persona_name']}
    user_story: {data['user_story']}
    First start by giving the user Story a Summary: [concise, memorable, human-readable story title] 
    User Story Format example:
        As a: [persona_type]
        I want to: [Action or Goal]
        So that: [Benefit or Value]
        Additional Context: [Optional details about the scenario, environment, or specific requirements]
        Acceptance Criteria: [Specific, measurable conditions that must be met for the story to be considered complete]
            *   **Scenario**: 
                    [concise, human-readable user scenario]
            *   **Given**: 
                    [Initial context]
            *   **and Given**: 
                    [Additional Given context]
            *   **and Given** 
                    [additional Given context statements as needed]
            *   **When**: 
                    [Event occurs]
            *   **Then**: 
                    [Expected outcome]
    All the answers are required to be in {data['story_lang']} and to stick to the persona. 
    """
    
    response_story = sendPrompt(prompt, model)
    return jsonify({'content': response_story, 'prompt': prompt})

@story_to_code_bp.route('/generate/tasks', methods=['POST'])
def generate_tasks():
    data = request.json
    model = load_models(data['model_name'])
    
    prompt = f"""All the answers are required to be in {data['story_lang']} and to stick to the persona.
    Divide the user story into tasks as granular as possible.
    The goal of fragmenting a user story is to create a list of tasks that can be completed within a sprint.
    Therefore, it is important to break down the story into minimal tasks that still add value to the end user.
    This facilitates progress tracking and ensures that the team stays on track.
    Create a table with the tasks as the table index with the task description.
    """ + data['story_content']
    
    response_tasks = sendPrompt(prompt, model)
    return jsonify({'content': response_tasks, 'prompt': prompt})

@story_to_code_bp.route('/generate/code', methods=['POST'])
def generate_code():
    data = request.json
    model = load_models(data['model_name'])
    
    prompt = f"""
        Based on the list of tasks, create Python code snippets to implement the functionality for the first task in the list.
        Identify specific constraints or requirements that impact the implementation:
        Time or resource limitations
        Compatibility with external APIs or libraries
        Coding standards or style guidelines to be followed
        Clearly document any assumptions or premises made.
        Follow these directives:
        - Use Google Style Guide for formatting
        - Utilize existing tools and frameworks
        - Ensure code reproducibility in different environments
        - Format code with proper indentation and spacing
        - Include explanatory comments for each section of the code
        - Provide documentation with usage examples and additional information
        All the answers are required to be in {data['story_lang']} and to stick to the persona.
        Create code only for the first task. Make a numbered list where the first item is the task name, the second is a summary of the code, and then include the generated snippet and as many new items as needed to complement the required information.
"""  + data['tasks_content']
    
    response_code = sendPrompt(prompt, model)
    return jsonify({'content': response_code, 'prompt': prompt})

@story_to_code_bp.route('/generate/test', methods=['POST'])
def generate_test():
    data = request.json
    model = load_models(data['model_name'])
    
    prompt = f"""
        All the answers are required to be in {data['story_lang']}.
        You are an expert software developer specializing in writing high-quality unit tests. Your task is to create comprehensive unit tests for the given code snippet. Follow these guidelines:

        Analyze the provided code carefully, identifying its purpose, inputs, outputs, and potential edge cases.
        Create a suite of unit tests that covers:

        Happy path scenarios
        Edge cases
        Error handling
        Boundary conditions

        Use appropriate testing frameworks and assertions based on the programming language of the code.
        Follow best practices for unit testing, including:

        Descriptive test names
        Arrange-Act-Assert (AAA) pattern
        One assertion per test when possible
        Proper setup and teardown if needed

        Include comments explaining the purpose of each test and any complex logic.
        If the code has dependencies, suggest appropriate mocking or stubbing strategies.
        Provide a brief explanation of your testing approach and any assumptions made.
        Please generate a comprehensive set of unit tests for this code, following the guidelines above.

        Given the following code snippet:

        """ + data['code_content']
    
    response_test = sendPrompt(prompt, model)
    return jsonify({'content': response_test, 'prompt': prompt})
