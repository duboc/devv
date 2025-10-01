import os
import shutil
import git
import magika
import re
import datetime
import json
from pathlib import Path
from flask import render_template, request, jsonify, current_app

# Use the centralized GeminiClient and standard types
from utils.utils_vertex import GeminiClient
from google.genai import types as genai_types

from . import repo_cache_analysis_bp

# Constants
REPO_DIR = "./repo_cache"
HISTORY_DIR = "./history"

# Ensure history directory exists
os.makedirs(HISTORY_DIR, exist_ok=True)

# Initialize Magika
m = magika.Magika()

# --- Helper Functions ---

def get_gemini_client():
    """Initializes and returns a GeminiClient instance."""
    return GeminiClient(project_id=os.getenv('GCP_PROJECT'))

def clone_repo(repo_url, repo_dir):
    if os.path.exists(repo_dir):
        shutil.rmtree(repo_dir)
    os.makedirs(repo_dir)
    git.Repo.clone_from(repo_url, repo_dir)
    return True

def extract_code(repo_dir):
    code_index = []
    code_text = ""
    for root, _, files in os.walk(repo_dir):
        for file in files:
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, repo_dir)
            code_index.append(relative_path)

            try:
                file_type = m.identify_path(Path(file_path))
                if file_type.output.group in ("text", "code"):
                    with open(file_path, "r", encoding='utf-8', errors='ignore') as f:
                        code_text += f"----- File: {relative_path} -----\n"
                        code_text += f.read()
                        code_text += "\n-------------------------\n"
            except Exception:
                pass # Ignore files that can't be read
    return code_index, code_text, len(code_text)

def get_code_prompt(question, code_index, code_text):
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

def save_analysis(analysis_type, analysis_text, repo_url):
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    sanitized_repo = re.sub(r'[^a-zA-Z0-9]', '_', repo_url)
    filename = f"{timestamp}_{analysis_type}_{sanitized_repo[:50]}.json"
    filepath = os.path.join(HISTORY_DIR, filename)
    
    try:
        with open(filepath, "w") as f:
            json.dump({
                "type": analysis_type,
                "text": analysis_text,
                "repo_url": repo_url,
                "timestamp": timestamp
            }, f)
    except Exception as e:
        print(f"Error saving analysis: {e}")

# --- Routes ---

@repo_cache_analysis_bp.route('/')
def index():
    # The template might need simplification, but for now, we just render it.
    return render_template('repo_cache_analysis.html')

@repo_cache_analysis_bp.route('/process', methods=['POST'])
def process_repository():
    if not current_app.config.get('VERTEXAI_INITIALIZED'):
        return jsonify({'error': 'Vertex AI is not initialized. Please check server logs.'}), 500

    data = request.get_json()
    repo_url = data.get('repo_url')
    
    if not repo_url:
        return jsonify({'error': 'Repository URL is required'}), 400

    try:
        clone_repo(repo_url, REPO_DIR)
        code_index, code_text, char_count = extract_code(REPO_DIR)

        # Caching is removed. We just return the extracted code.
        return jsonify({
            'message': f"Repository cloned and indexed successfully! Character count: {char_count}",
            'char_count': char_count,
            'code_index': code_index,
            'code_text': code_text  # Send the full code text to the client
        })
    except Exception as e:
        current_app.logger.error(f"Error processing repository: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@repo_cache_analysis_bp.route('/analyze', methods=['POST'])
def analyze_repository():
    if not current_app.config.get('VERTEXAI_INITIALIZED'):
        return jsonify({'error': 'Vertex AI is not initialized. Please check server logs.'}), 500
        
    data = request.get_json()
    question = data.get('question')
    repo_url = data.get('repo_url')
    analysis_type = data.get('analysis_type')
    code_index = data.get('code_index')
    code_text = data.get('code_text') # Expect the full code text from the client

    if not all([question, repo_url, analysis_type, code_index, code_text]):
        return jsonify({'error': 'Missing required parameters for analysis'}), 400

    try:
        client = get_gemini_client()
        
        # Construct the full prompt with the code text for each analysis
        prompt = get_code_prompt(question, code_index, code_text)
        contents = [genai_types.Content(role="user", parts=[genai_types.Part(text=prompt)])]

        response_text = client.generate_content(
            contents=contents,
            model=data.get('model_name'),
            generation_config=genai_types.GenerateContentConfig(
                max_output_tokens=8192,
                temperature=0.4,
                top_p=1
            )
        )
        
        save_analysis(analysis_type, response_text, repo_url)
        
        return jsonify({'analysis': response_text})
    except Exception as e:
        current_app.logger.error(f"Error analyzing repository: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@repo_cache_analysis_bp.route('/history', methods=['GET'])
def get_history():
    history = []
    if not os.path.exists(HISTORY_DIR):
        return jsonify([])

    try:
        files = sorted(
            [os.path.join(HISTORY_DIR, f) for f in os.listdir(HISTORY_DIR) if f.endswith(".json")],
            key=os.path.getmtime,
            reverse=True
        )
        for filepath in files:
            with open(filepath, "r") as f:
                history.append(json.load(f))
    except Exception as e:
        current_app.logger.error(f"Error loading history files: {e}", exc_info=True)

    return jsonify(history)
