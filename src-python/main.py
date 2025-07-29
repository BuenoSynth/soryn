import asyncio
import json
from flask import Flask, request, jsonify
from dataclasses import asdict
from flask_cors import CORS
import traceback

from models_manager import ModelsManager
from debate_engine import DebateEngine, DebateRequest

# --- Configuração Inicial ---
app = Flask(__name__)
CORS(app)

models_manager = ModelsManager()
debate_engine = DebateEngine(models_manager=models_manager)

# --- Rotas de Gerenciamento ---

@app.route('/api/models', methods=['GET'])
async def get_all_models():
    """Endpoint principal que a interface usará para obter a lista de todos os modelos."""
    try:
        unified_list = await models_manager.get_unified_models_list()
        return jsonify([asdict(model) for model in unified_list])
    except Exception as e:
        logger.error(f"Erro ao obter lista unificada de modelos: {e}")
        return jsonify({"erro": "Falha ao buscar modelos"}), 500

@app.route('/api/models/remote', methods=['POST'])
def add_remote_api_model():
    """Endpoint para o usuário adicionar uma nova chave de API pela interface."""
    data = request.get_json()
    required_fields = ['provider', 'api_key', 'model_id', 'model_name', 'api_model_name']
    if not all(field in data for field in required_fields):
        return jsonify({"erro": "Campos necessários ausentes"}), 400

    try:
        # A função agora retorna uma tupla (sucesso, mensagem)
        success, message = models_manager.add_remote_model(
            provider=data['provider'],
            api_key=data['api_key'],
            model_id=data['model_id'],
            model_name=data['model_name'],
            api_model_name=data['api_model_name']
        )

        if success:
            return jsonify({"sucesso": message}), 201
        else:
            # Retorna a mensagem de erro específica com o código 409 Conflict
            return jsonify({"erro": message}), 409
    except Exception as e:
        logger.error(f"Erro ao adicionar modelo remoto: {e}")
        return jsonify({"erro": "Falha ao salvar modelo de API"}), 500

@app.route('/api/models/remote/<string:model_id>', methods=['DELETE'])
def delete_remote_api_model(model_id):
    """Endpoint para o usuário remover uma chave de API pela interface."""
    try:
        success = models_manager.delete_remote_model(model_id)
        if success:
            return jsonify({"sucesso": f"Modelo {model_id} removido."}), 200
        else:
            return jsonify({"erro": f"Modelo {model_id} não encontrado."}), 404
    except Exception as e:
        logger.error(f"Erro ao remover modelo remoto: {e}")
        return jsonify({"erro": "Falha ao remover modelo de API"}), 500

# --- Rota de Debate ---
@app.route('/debate', methods=['POST'])
def debate():
    try:
        dados = json.loads(request.data)
        if 'prompt' not in dados or 'models' not in dados:
            return jsonify({"erro": "JSON deve conter 'prompt' e 'models'"}), 400

        debate_request = DebateRequest(
            prompt=dados['prompt'],
            model_ids=dados['models'],
            evaluation_criteria={}
        )

        result = asyncio.run(debate_engine.conduct_debate(debate_request))

        result_dict = asdict(result)
        result_dict['timestamp'] = result.timestamp.isoformat()

        return jsonify(result_dict)

    except Exception as e:
        # Imprime o traceback completo no console para depuração
        print("!!! OCORREU UMA EXCEÇÃO DURANTE O DEBATE !!!")
        traceback.print_exc()
        # --------------------------------
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)