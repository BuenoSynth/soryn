import asyncio
import json
import logging
from dataclasses import asdict
from flask import Flask, request, jsonify
from flask_cors import CORS

# Módulos locais do projeto Soryn
from models_manager import ModelsManager
from debate_engine import DebateEngine, DebateRequest
from ai_inference import InferenceRequest
import database as db

# --- Configuração Inicial ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("soryn")

app = Flask(__name__)
CORS(app)

# Inicializa o banco de dados e as tabelas na primeira execução
db.initialize_database()

# Instancia os gerenciadores principais
models_manager = ModelsManager()
debate_engine = DebateEngine(models_manager=models_manager)

# --- Endpoints Principais da Aplicação ---

@app.route('/chat', methods=['POST'])
async def handle_chat():
    """Processa uma mensagem de chat, criando ou continuando uma conversa."""
    data = request.get_json()
    if not data or 'model_id' not in data or 'prompt' not in data:
        return jsonify({"erro": "Requisição inválida. 'model_id' e 'prompt' são obrigatórios."}), 400

    chat_id = data.get('chat_id')  # ID de um chat existente (opcional)
    model_id = data['model_id']
    user_prompt = data['prompt']

    try:
        # Se for a primeira mensagem, cria um novo chat no banco
        if not chat_id:
            chat_id = db.create_new_chat(model_id, user_prompt)
            if not chat_id:
                raise Exception("Falha ao criar nova entrada de chat no banco de dados.")
        else:
            # Se for uma continuação, apenas adiciona a mensagem do usuário
            db.add_message_to_chat(chat_id, 'user', user_prompt)

        # Buscar o histórico COMPLETO do chat (que já inclui o prompt acima)
        chat_history_data = db.get_chat_history(chat_id)
        if not chat_history_data:
            return jsonify({"erro": "Falha ao buscar histórico do chat."}), 500
        
        # Formatar o histórico para o formato de API
        # A função get_chat_history retorna um dict com a chave 'messages'
        messages_history = []
        for msg in chat_history_data['messages']:
            messages_history.append({
                "role": msg['role'],
                "content": msg['content']
            })

        # Busca a configuração do modelo
        all_models = await models_manager.get_unified_models_list()
        model_config = next((m for m in all_models if m.id == model_id), None)
        if not model_config:
            return jsonify({"erro": f"Modelo '{model_id}' não encontrado."}), 404

        # Executa a inferência com o histórico completo
        inference_req = InferenceRequest(
            model_id=model_id,
            prompt=user_prompt,  # Mantém para fallback (embora não deva ser usado)
            messages=messages_history  # PASSANDO O HISTÓRICO
        )
        
        response = await debate_engine.run_single_inference(inference_req, model_config)

        if response.success:
            # Salva a resposta do assistente no banco
            db.add_message_to_chat(chat_id, 'assistant', response.response_text)
            return jsonify({"response": response.response_text, "chat_id": chat_id})
        else:
            err_msg = response.error_message or "Falha na inferência do modelo."
            logger.error(f"Erro de inferência para o modelo {model_id}: {err_msg}")
            return jsonify({"erro": err_msg}), 500

    except Exception as e:
        logger.error(f"Erro inesperado no endpoint /chat: {e}", exc_info=True)
        return jsonify({"erro": "Ocorreu um erro interno no servidor."}), 500


@app.route('/debate', methods=['POST'])
async def handle_debate():
    """Executa um debate e salva o resultado no histórico."""
    data = request.get_json()
    if not data or 'prompt' not in data or 'models' not in data:
        return jsonify({"erro": "JSON deve conter 'prompt' e 'models'"}), 400

    try:
        debate_request = DebateRequest(
            prompt=data['prompt'],
            model_ids=data['models'],
            evaluation_criteria={}
        )
        
        # Conduz o debate
        result = await debate_engine.conduct_debate(debate_request)
        result_dict = asdict(result)
        
        # Salva o resultado no banco de dados
        db.save_debate_result(result_dict)
        
        # Prepara o resultado para o frontend
        result_dict['timestamp'] = result.timestamp.isoformat()
        return jsonify(result_dict)

    except Exception as e:
        logger.error("Erro durante o debate: ", exc_info=True)
        return jsonify({"erro": str(e)}), 500


# --- Endpoints de Gerenciamento de Histórico ---

@app.route('/api/history', methods=['GET'])
def get_history_list():
    """Retorna uma lista de previews de todos os chats e debates."""
    try:
        history_items = db.get_all_history_previews()
        return jsonify(history_items)
    except Exception as e:
        logger.error("Erro ao buscar lista de histórico: ", exc_info=True)
        return jsonify({"erro": "Falha ao buscar o histórico."}), 500

@app.route('/api/history/<string:item_type>/<string:item_id>', methods=['GET'])
def get_history_item_details(item_type, item_id):
    """Retorna os detalhes completos de um item específico do histórico."""
    try:
        details = None
        if item_type == 'chat':
            details = db.get_chat_history(item_id)
        elif item_type == 'debate':
            details = db.get_debate_details(item_id)
        else:
            return jsonify({"erro": "Tipo de item inválido."}), 400

        if details:
            return jsonify(details)
        else:
            return jsonify({"erro": "Item não encontrado."}), 404
            
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes do item {item_id}: ", exc_info=True)
        return jsonify({"erro": "Falha ao buscar detalhes do item."}), 500

@app.route('/api/history/<string:item_type>/<string:item_id>', methods=['DELETE'])
def delete_history_item(item_type, item_id):
    """Deleta um item específico do histórico."""
    try:
        success = db.delete_history_item(item_id, item_type)
        if success:
            return jsonify({"sucesso": f"Item {item_id} deletado."}), 200
        else:
            return jsonify({"erro": "Item não encontrado ou falha ao deletar."}), 404
    except Exception as e:
        logger.error(f"Erro ao deletar o item {item_id}: ", exc_info=True)
        return jsonify({"erro": "Falha ao deletar o item."}), 500


# --- Endpoints de Gerenciamento de Modelos ---

@app.route('/api/models', methods=['GET'])
async def get_all_models():
    """Retorna lista unificada de todos os modelos."""
    try:
        unified_list = await models_manager.get_unified_models_list()
        return jsonify([asdict(model) for model in unified_list])
    except Exception as e:
        logger.error(f"Erro ao obter lista de modelos: {e}", exc_info=True)
        return jsonify({"erro": "Falha ao buscar modelos"}), 500

@app.route('/api/models/remote', methods=['POST'])
def add_remote_api_model():
    """Adiciona um modelo remoto via API."""
    data = request.get_json()
    required_fields = ['provider', 'api_key', 'model_id', 'name', 'api_model_name']

    if not all(field in data for field in required_fields):
        return jsonify({"erro": "Campos necessários ausentes"}), 400

    try:
        success, message = models_manager.add_remote_model(
            provider=data['provider'],
            api_key=data['api_key'],
            model_id=data['model_id'],
            name=data['name'],
            api_model_name=data['api_model_name']
        )
        if success:
            return jsonify({"sucesso": message}), 201
        else:
            return jsonify({"erro": message}), 409
    except Exception as e:
        logger.error(f"Erro ao adicionar modelo remoto: {e}", exc_info=True)
        return jsonify({"erro": "Falha ao salvar modelo de API"}), 500


@app.route('/api/models/remote/<string:model_id>', methods=['DELETE'])
def delete_remote_api_model(model_id):
    """Remove um modelo remoto pelo seu ID."""
    try:
        success = models_manager.delete_remote_model(model_id)
        if success:
            return jsonify({"sucesso": f"Modelo {model_id} removido."}), 200
        else:
            return jsonify({"erro": f"Modelo {model_id} não encontrado."}), 404
    except Exception as e:
        logger.error(f"Erro ao remover modelo remoto: {e}", exc_info=True)
        return jsonify({"erro": "Falha ao remover modelo de API"}), 500


@app.route('/api/models/remote/<string:model_id>', methods=['PUT'])
def update_remote_api_model(model_id):
    """Edita um modelo remoto existente."""
    data = request.get_json()
    required_fields = ['provider', 'api_key', 'name', 'api_model_name']

    if not all(field in data for field in required_fields):
        return jsonify({"erro": "Campos necessários ausentes"}), 400

    try:
        success, message = models_manager.update_remote_model(model_id, data)
        if success:
            return jsonify({"sucesso": message}), 200
        else:
            status_code = 409 if "já está em uso" in message else 404
            return jsonify({"erro": message}), status_code
    except Exception as e:
        logger.error(f"Erro ao atualizar modelo remoto: {e}", exc_info=True)
        return jsonify({"erro": "Falha ao atualizar modelo de API"}), 500


if __name__ == '__main__':
    logger.info("🚀 Servidor Flask do Soryn iniciado em http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)

