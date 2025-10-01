from flask import render_template, request, jsonify
from . import story_to_data_bp
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

@story_to_data_bp.route('/')
def story_to_data_index():
    questions = load_questions('./data/retail-en.txt')
    industries = ["retail", "energy", "health", "finance", "beauty"]
    languages = ["English", "Portuguese", "Spanish"]
    models = [model_gemini_flash, model_gemini_pro]
    
    return render_template('story_to_data.html', 
                           questions=questions, 
                           industries=industries, 
                           languages=languages,
                           models=models)

def load_models(model_name):
    return model_name

@story_to_data_bp.route('/generate/story', methods=['POST'])
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

@story_to_data_bp.route('/generate/tasks', methods=['POST'])
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

@story_to_data_bp.route('/generate/dw', methods=['POST'])
def generate_dw():
    data = request.json
    model = load_models(data['model_name'])
    
    prompt = f"""
        Análise da User Story:
        All the answers are required to be in {data['story_lang']}.
        Exemplo:
        User Story: "Como médico, quero poder acompanhar o histórico de consultas dos meus pacientes, incluindo datas, diagnósticos, procedimentos realizados e medicamentos prescritos."

        Tasks:
        - Acessar o prontuário eletrônico do paciente.
        - Visualizar lista de consultas anteriores com detalhes.
        - Adicionar novas informações sobre a consulta atual.

        Gere uma sugestão de tabela DW para armazenar os dados necessários para atender a essa user story.
        Fim exemplo:

        Leia atentamente a descrição da user story de varejo fornecida.
        Identifique as tasks (ou atividades) que compõem a user story.
        Extraia os principais substantivos e verbos das tasks, pois eles podem indicar dimensões e fatos relevantes para a tabela DW.


        Modelagem Dimensional:

        Crie uma lista de dimensões candidatas com base nos substantivos identificados. Exemplos de dimensões comuns em saúde:
        Paciente
        Profissional de Saúde (Médico, Enfermeiro, etc.)
        Instituição de Saúde (Hospital, Clínica, etc.)
        Tempo (Data, Hora, Dia da Semana, Mês, Ano)
        Procedimento Médico
        Medicamento
        Diagnóstico
        Plano de Saúde
        [Coloque sempre em formato de tabela]

        Modelagem de Fatos:
        Identifique os fatos (eventos mensuráveis) a partir dos verbos das tasks. 
        Exemplos de fatos em saúde:
        Consulta Médica
        Internação
        Exame
        Cirurgia
        Prescrição de Medicamento

        Determine as métricas (valores numéricos) associadas a cada fato. 

        Exemplos de métricas:
        Duração da Consulta
        Custo do Procedimento
        Dosagem do Medicamento
        Resultados do Exame
        [Coloque sempre em formato de tabela]

        Estrutura da Tabela DW:

        Crie uma tabela com as seguintes colunas:
        Chave Primária: Identificador único da linha (geralmente um número sequencial).
        Chaves Estrangeiras: Colunas que se referem às chaves primárias das dimensões.
        Métricas: Colunas que armazenam os valores numéricos dos fatos.
        Defina os tipos de dados adequados para cada coluna.
        [Coloque sempre em formato de tabela]

        Inclua exemplos de dados que poderiam ser inseridos na tabela DW, com base nas tasks da user story.  

        Sempre ao gerar dados mock, utilize algum nome da seguinte lista:
        Breno, Amadei, Carlos, Mazurque, Kauy, Filipe, Renato, Wilgner, Rober, Diego, Iago, Tiago, Brunno, Koba
        Utilize o dados abaixo como entrada. 
    """ + data['tasks_content']
    
    response_snippets = sendPrompt(prompt, model)
    return jsonify({'content': response_snippets, 'prompt': prompt})

@story_to_data_bp.route('/generate/bigquery', methods=['POST'])
def generate_bigquery():
    data = request.json
    model = load_models(data['model_name'])
    
    prompt = f"""
        All the answers are required to be in {data['story_lang']}.
        ## Prompt para Criação de Tabela DW no BigQuery a Partir de Sugestão (Saúde)
        
        **Instruções para o Modelo:**
        
        1. **Recebimento da Sugestão:**
           - Receba a sugestão de tabela DW gerada anteriormente para o contexto de saúde, incluindo:
              - Nome da tabela
              - Dimensões (com seus atributos e tipos de dados)
              - Fatos (com suas métricas e tipos de dados)
              - Exemplos de dados (opcional)
        
        2. **Criação do Dataset no BigQuery:**
           - Utilize o comando `gcloud` para criar um novo dataset no BigQuery, caso ainda não exista:
             ```bash
             gcloud bigquery datasets create [NOME_DO_DATASET] --location=[LOCALIZAÇÃO]
             ```
             - Substitua `[NOME_DO_DATASET]` por um nome relevante para o contexto de saúde (ex: `dados_saude`).
             - Substitua `[LOCALIZAÇÃO]` pela localização geográfica do dataset (ex: `southamerica-east1`).
        
        3. **Criação das Tabelas de Dimensão:**
           - Para cada dimensão na sugestão, gere um comando SQL `CREATE TABLE` para criar a tabela correspondente no BigQuery:
             ```sql
             CREATE TABLE [NOME_DO_DATASET].[NOME_DA_DIMENSÃO] (
                 [ID_DIMENSÃO] [TIPO_DE_DADO] PRIMARY KEY,
                 [ATRIBUTO1] [TIPO_DE_DADO],
                 [ATRIBUTO2] [TIPO_DE_DADO],
                 ...
             );
             ```
             - Substitua `[NOME_DO_DATASET]` pelo nome do dataset criado.
             - Substitua `[NOME_DA_DIMENSÃO]` pelo nome da dimensão (ex: `Paciente`, `Profissional_Saude`, `Procedimento_Medico`).
             - Substitua `[ID_DIMENSÃO]` pelo nome do atributo chave primária da dimensão (ex: `ID_Paciente`, `ID_Profissional`, `ID_Procedimento`).
             - Substitua `[TIPO_DE_DADO]` pelo tipo de dado apropriado para cada atributo (ex: `INTEGER`, `STRING`, `DATE`, `FLOAT`).
        
        4. **Criação da Tabela de Fato:**
           - Gere um comando SQL `CREATE TABLE` para criar a tabela de fato no BigQuery:
             ```sql
             CREATE TABLE [NOME_DO_DATASET].[NOME_DA_TABELA_FATO] (
                 [ID_FATO] [TIPO_DE_DADO] PRIMARY KEY,
                 [FK_DIMENSÃO1] [TIPO_DE_DADO] REFERENCES [NOME_DO_DATASET].[NOME_DA_DIMENSÃO1]([ID_DIMENSÃO1]),
                 [FK_DIMENSÃO2] [TIPO_DE_DADO] REFERENCES [NOME_DO_DATASET].[NOME_DA_DIMENSÃO2]([ID_DIMENSÃO2]),
                 ...
                 [METRICA1] [TIPO_DE_DADO],
                 [METRICA2] [TIPO_DE_DADO],
                 ...
             );
             ```
             - Substitua `[NOME_DA_TABELA_FATO]` pelo nome da tabela de fato (ex: `Fato_Consulta`).
             - Substitua `[FK_DIMENSÃO]` pelos nomes das chaves estrangeiras que se referem às dimensões (ex: `FK_Paciente`, `FK_Profissional`).
             - Substitua `[METRICA]` pelos nomes das métricas (ex: `Duracao_Consulta`, `Custo_Procedimento`).
        
        5. **Inserção de Dados (Opcional)
           - Se a sugestão incluir exemplos de dados, gere comandos SQL `INSERT INTO` para inserir esses dados nas tabelas criadas.
        
        **Exemplo de Prompt (Saúde):**
        
        ```
        Sugestão de Tabela DW:
        
        Nome da Tabela: Fato_Consulta
        
        Dimensões:
        - Paciente (ID_Paciente INTEGER, Nome STRING, Data_Nascimento DATE)
        - Profissional_Saude (ID_Profissional INTEGER, Nome STRING, Especialidade STRING)
        - Procedimento_Medico (ID_Procedimento INTEGER, Descricao STRING)
        
        Fatos:
        - Data_Consulta DATE
        - Duracao_Consulta INTEGER
        - Custo_Procedimento FLOAT
        
        Crie as tabelas no BigQuery e gere os comandos SQL necessários.
        ```
        
        
        Dados:

    """ + data['dw_content']
    
    response_bigquery = sendPrompt(prompt, model)
    return jsonify({'content': response_bigquery, 'prompt': prompt})
