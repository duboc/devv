from flask import render_template, request, jsonify
from . import repo_inspection_bp
import os
import shutil
from pathlib import Path
import git
import magika
from utils.utils_vertex import sendPrompt

# Initialize Magika
m = magika.Magika()

# Constants
REPO_DIR = "./repo_cache"

@repo_inspection_bp.route('/')
def repo_inspection_index():
    """Renders the main page for the Repo Inspection tool."""
    analysis_options = {
        "summary": "Provide a comprehensive summary of the codebase, highlighting its architecture, main components, and top 3 key learnings for developers.",
        "readme": "Generate a detailed README for the application, including project overview, setup instructions, main features, and contribution guidelines.",
        "onboarding": "Create an in-depth getting started guide for new developers, covering setup process, code structure, development workflow, and best practices.",
        "issues": "Conduct a thorough code review to identify and explain the top 3 most critical issues or areas for improvement in the codebase.",
        "bug_fix": "Identify the most severe potential bug or vulnerability in the codebase, explain its impact, and provide a detailed fix with code examples.",
        "troubleshooting": "Develop a comprehensive troubleshooting guide for common issues, including potential error scenarios, diagnostics steps, and resolution procedures.",
        "custom": "Custom analysis (specify your own prompt)"
    }
    models = [os.getenv("MODEL_GEMINI_FLASH", "gemini-1.5-flash-001"), os.getenv("MODEL_GEMINI_PRO", "gemini-1.5-pro-001")]
    return render_template('repo_inspection.html', models=models, analysis_options=analysis_options)

def clone_repo(repo_url, repo_dir):
    """Clones a Git repository, removing the old one if it exists."""
    if os.path.exists(repo_dir):
        shutil.rmtree(repo_dir)
    os.makedirs(repo_dir)
    git.Repo.clone_from(repo_url, repo_dir)
    return True

def extract_code(repo_dir):
    """Extracts code files from a directory, creating an index and concatenated text."""
    code_index = []
    code_text = ""
    for root, _, files in os.walk(repo_dir):
        for file in files:
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, repo_dir)
            
            # Ignore .git directory and other non-essential files
            if ".git" in file_path.split(os.sep):
                continue

            code_index.append(relative_path)
            
            try:
                file_type = m.identify_path(Path(file_path))
                if file_type.output.group in ("text", "code"):
                    with open(file_path, "r", encoding='utf-8', errors='ignore') as f:
                        code_text += f"----- File: {relative_path} -----\n"
                        code_text += f.read()
                        code_text += "\n-------------------------\n"
            except Exception:
                # Ignore files that can't be read
                pass
    return code_index, code_text

@repo_inspection_bp.route('/clone_and_index', methods=['POST'])
def clone_and_index():
    """Clones and indexes a repository, returns the file index and content."""
    data = request.json
    repo_url = data.get('repo_url')
    if not repo_url:
        return jsonify({'error': 'Repository URL is required'}), 400
        
    try:
        clone_success = clone_repo(repo_url, REPO_DIR)
        if clone_success:
            code_index, code_text = extract_code(REPO_DIR)
            return jsonify({
                'message': 'Repository cloned and indexed successfully!',
                'index': code_index,
                'text': code_text
            })
    except Exception as e:
        return jsonify({'error': f"Failed to clone or index repository: {str(e)}"}), 500

def get_code_prompt(question, code_index, code_text):
    """Formats the prompt for the Gemini model."""
    return f"""
    Task: {question}

    Context:
    - You are an expert code analyzer and technical writer.
    - The entire codebase is provided below.
    - Here is an index of all the files in the codebase:
      \n\n{code_index}\n\n
    - The content of each file is concatenated below:
      \n\n{code_text}\n\n

    Instructions:
    1. Carefully analyze the provided codebase.
    2. Focus on addressing the specific task or question given.
    3. Provide a comprehensive and well-structured response.
    4. Use markdown formatting to enhance readability.
    5. If relevant, include code snippets or examples from the codebase.
    6. Ensure your analysis is accurate, insightful, and actionable.

    Response:
    """

@repo_inspection_bp.route('/generate_analysis', methods=['POST'])
def generate_analysis():
    """Generates code analysis using the Gemini model."""
    data = request.json
    model_name = data.get('model_name')
    question = data.get('question')
    code_index = data.get('code_index')
    code_text = data.get('code_text')

    if not all([model_name, question, code_index, code_text]):
        return jsonify({'error': 'Missing required data for analysis'}), 400

    try:
        prompt = get_code_prompt(question, code_index, code_text)
        response = sendPrompt(prompt, model_name)
        return jsonify({'content': response, 'prompt': prompt})
    except Exception as e:
        return jsonify({'error': f"Failed to generate analysis: {str(e)}"}), 500
