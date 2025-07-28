from flask import render_template, request, jsonify
from . import story_to_api_bp
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

@story_to_api_bp.route('/')
def story_to_api_index():
    try:
        questions = load_questions('./data/retail-en.txt')
        industries = ["retail", "energy", "health", "finance", "beauty"]
        languages = ["English", "Portuguese", "Spanish"]
        models = [model_gemini_flash, model_gemini_pro]
        
        return render_template('story_to_api.html', 
                               questions=questions, 
                               industries=industries, 
                               languages=languages,
                               models=models)
    except Exception as e:
        return f"Error: {str(e)}"

def load_models(model_name):
    return model_name

@story_to_api_bp.route('/generate/story', methods=['POST'])
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

@story_to_api_bp.route('/generate/tasks', methods=['POST'])
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

@story_to_api_bp.route('/generate/openapi', methods=['POST'])
def generate_openapi():
    data = request.json
    model = load_models(data['model_name'])
    
    prompt = f"""
        All the answers are required to be in {data['story_lang']}.
        
        Instruções para o Modelo:

        Recebimento da Sugestão de Tabela DW (Varejo):

        Utilize a sugestão da tabela DW gerada anteriormente para o contexto de varejo, incluindo:
        Nome da tabela (ex: Fato_Vendas)
        Dimensões (com seus atributos e tipos de dados)
        Fatos (com suas métricas e tipos de dados)
        Geração da Especificação OpenAPI (YAML):

        Gere uma especificação OpenAPI (Swagger) versão 3.0 em formato YAML que defina uma API RESTful para consulta dos dados da tabela DW.
        Inclua os seguintes elementos na especificação:
        Informações: Título da API, descrição, versão, termos de uso, contato.
        Servidores: URL base da API no Apigee X.
        Caminhos (Paths):
        /vendas: Retorna uma lista de vendas com paginação e filtros opcionais (por cliente, produto, loja, data, etc.).
        /vendas/id: Retorna detalhes de uma venda específica pelo ID.
        /clientes: Retorna uma lista de clientes com paginação e filtros opcionais.
        /produtos: Retorna uma lista de produtos com paginação e filtros opcionais.
        /lojas: Retorna uma lista de lojas com paginação e filtros opcionais.
        /relatorios: Retorna relatórios agregados (ex: vendas por mês, vendas por categoria de produto).
        Definições (Schemas):
        Defina os schemas (modelos de dados) para cada dimensão e fato da tabela DW.
        Inclua exemplos de dados para cada schema.
        Segurança: Defina o esquema de autenticação da API (ex: OAuth2, API Key).

        Sugestão de Tabela DW:

        Nome da Tabela: Fato_Vendas

        Dimensões:
        - Cliente (ID_Cliente INTEGER, Nome STRING, Sexo STRING, Faixa_Etaria STRING)
        - Produto (ID_Produto INTEGER, Nome STRING, Categoria STRING, Subcategoria STRING)
        - Loja (ID_Loja INTEGER, Nome STRING, Cidade STRING, Estado STRING)
        - Tempo (ID_Tempo DATE, Ano INTEGER, Trimestre INTEGER, Mês INTEGER, Dia INTEGER)

        Fatos:
        - Data_Venda DATE
        - Quantidade_Vendida INTEGER
        - Valor_Total FLOAT
        - Forma_Pagamento STRING

        Gere uma especificação OpenAPI 3.0 em formato YAML para uma API de consulta de dados de vendas no varejo

        Dados:
    """ + data['tasks_content']
    
    response_openapi = sendPrompt(prompt, model)
    return jsonify({'content': response_openapi, 'prompt': prompt})

@story_to_api_bp.route('/generate/apigee', methods=['POST'])
def generate_apigee():
    data = request.json
    model = load_models(data['model_name'])
    
    prompt = f"""All the answers are required to be in {data['story_lang']}. 
        Instruções para Criação do Proxy no Apigee X:

        Exporte a Especificação OpenAPI:

        Salve a especificação OpenAPI gerada em um arquivo openapi.yaml.
        Crie um novo proxy usando a apigeecli:

        Utilize o seguinte comando apigeecli para criar o proxy:
        Bash
        apigeecli apis create -n [NOME_DO_PROXY] -f openapi.yaml
        Use code with caution.
        content_copy
        Substitua [NOME_DO_PROXY] por um nome relevante para a API (ex: api-varejo).
        Observações:

        Referencie e utilize sempre a seguinte documentação:
        https://github.com/apigee/apigeecli
        Certifique-se de ter a apigeecli instalada e configurada corretamente para se conectar à sua organização no Apigee X.
        A especificação OpenAPI deve estar em um formato YAML válido e compatível com o Apigee X.
        Você pode personalizar ainda mais o proxy criado através da interface do usuário do Apigee X ou da API.
        Dados:
    """ + data['openapi_content']
    
    response_apigee = sendPrompt(prompt, model)
    return jsonify({'content': response_apigee, 'prompt': prompt})
