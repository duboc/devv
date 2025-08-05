import os
import shutil
import git
import magika
import vertexai
import re
import datetime
import json
import requests
import google.auth
from google.auth.transport.requests import Request
from pathlib import Path
from flask import render_template, request, jsonify, current_app
from vertexai.generative_models import GenerativeModel, Part, HarmCategory, HarmBlockThreshold
from vertexai.preview import caching
from vertexai.preview.generative_models import GenerativeModel as PreviewGenerativeModel
from . import repo_cache_analysis_bp

# Constants
MODEL_ID = "gemini-1.5-pro-002"
REPO_DIR = "./repo_cache"
HISTORY_DIR = "./history"
LOCATION = "us-central1"

# Ensure history directory exists
os.makedirs(HISTORY_DIR, exist_ok=True)

# Initialize Magika
m = magika.Magika()

# Safety settings
safety_settings = {
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
}

# --- Helper Functions ---

def get_access_token():
    try:
        credentials, _ = google.auth.default()
        credentials.refresh(Request())
        return credentials.token
    except Exception as e:
        print(f"Error getting access token: {e}")
        return None

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

# --- Routes ---

@repo_cache_analysis_bp.route('/')
def index():
    return render_template('repo_cache_analysis.html')

@repo_cache_analysis_bp.route('/process', methods=['POST'])
def process_repository():
    if not current_app.config.get('VERTEXAI_INITIALIZED'):
        return jsonify({'error': 'Vertex AI is not initialized. Please check server logs.'}), 500

    data = request.get_json()
    repo_url = data.get('repo_url')
    cache_ttl_hours = data.get('cache_ttl', 1)
    cache_ttl_seconds = cache_ttl_hours * 3600
    
    if not repo_url:
        return jsonify({'error': 'Repository URL is required'}), 400

    try:
        clone_repo(repo_url, REPO_DIR)
        code_index, code_text, char_count = extract_code(REPO_DIR)

        system_instruction = "You are an expert code analyzer and technical writer."
        contents = [Part.from_text(code_text)]
        
        cached_content = caching.CachedContent.create(
            model_name=MODEL_ID,
            system_instruction=system_instruction,
            contents=contents,
            ttl=datetime.timedelta(seconds=cache_ttl_seconds),
        )

        return jsonify({
            'message': f"Repository cloned, indexed, and cached successfully! Character count: {char_count}",
            'char_count': char_count,
            'cache_name': cached_content.name,
            'code_index': code_index,
            'code_text': code_text
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@repo_cache_analysis_bp.route('/analyze', methods=['POST'])
def analyze_repository():
    if not current_app.config.get('VERTEXAI_INITIALIZED'):
        return jsonify({'error': 'Vertex AI is not initialized. Please check server logs.'}), 500
        
    data = request.get_json()
    question = data.get('question')
    cache_name = data.get('cache_name')
    code_index = data.get('code_index')
    code_text = data.get('code_text')

    if not all([question, cache_name, code_index, code_text]):
        return jsonify({'error': 'Missing required parameters for analysis'}), 400

    try:
        model = PreviewGenerativeModel.from_cached_content(cached_content=caching.CachedContent(cache_name))
        
        prompt = get_code_prompt(question, code_index, code_text)

        response = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": 8192, "temperature": 0.4, "top_p": 1},
            safety_settings=safety_settings
        )
        
        return jsonify({'analysis': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@repo_cache_analysis_bp.route('/caches', methods=['GET'])
def list_caches():
    if not current_app.config.get('VERTEXAI_INITIALIZED'):
        return jsonify({'error': 'Vertex AI is not initialized. Please check server logs.'}), 500

    token = get_access_token()
    if not token:
        return jsonify({"error": "Failed to authenticate"}), 500
        
    project_id = os.getenv('GCP_PROJECT')
    url = f"https://{LOCATION}-aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/{LOCATION}/cachedContents"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return jsonify(response.json().get('cachedContents', []))
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to list caches: {e}"}), 500

@repo_cache_analysis_bp.route('/caches/<path:cache_name>', methods=['DELETE'])
def delete_cache(cache_name):
    if not current_app.config.get('VERTEXAI_INITIALIZED'):
        return jsonify({'error': 'Vertex AI is not initialized. Please check server logs.'}), 500

    token = get_access_token()
    if not token:
        return jsonify({"error": "Failed to authenticate"}), 500

    project_id = os.getenv('GCP_PROJECT')
    cache_id = cache_name.split('/')[-1]
    url = f"https://{LOCATION}-aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/{LOCATION}/cachedContents/{cache_id}"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        return jsonify({"message": f"Cache {cache_id} deleted successfully."})
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to delete cache {cache_id}: {e}"}), 500
