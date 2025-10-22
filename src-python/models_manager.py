# src-python/models_manager.py (VERSÃO CORRIGIDA E COMPLETA)

import json
import os
import asyncio
import aiohttp
import logging
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Literal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ModelProvider = Literal["ollama", "openai", "gemini"]

@dataclass
class ModelConfig:
    id: str
    name: str
    provider: ModelProvider
    description: Optional[str] = ""
    api_key: Optional[str] = None
    api_model_name: Optional[str] = None
    is_available: bool = True

class ModelsManager:
    def __init__(self):
        base_dir = Path(__file__).resolve().parent
        self.config_path = base_dir / "user_config.json"
        self.logger = logging.getLogger(__name__)
        
        self.remote_models: List[ModelConfig] = self._load_user_config()

    def _load_user_config(self) -> List[ModelConfig]:
        if not os.path.exists(self.config_path):
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump({"remote_models": []}, f)
            return []
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            models = [ModelConfig(**model_data) for model_data in data.get("remote_models", [])]
            logger.info(f"Carregados {len(models)} modelos remotos da config do usuário.")
            return models
        except Exception as e:
            logger.error(f"Erro ao carregar user_config.json: {e}")
            return []

    def _save_user_config(self):
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                data_to_save = {"remote_models": [asdict(model) for model in self.remote_models]}
                json.dump(data_to_save, f, indent=2, ensure_ascii=False)
            logger.info("Configurações do usuário salvas.")
        except Exception as e:
            logger.error(f"Erro ao salvar user_config.json: {e}")

    async def discover_ollama_models(self) -> List[ModelConfig]:
        """Detecta modelos instalados no Ollama via API REST."""
        logger.info("Tentando detectar modelos do Ollama via API...")
        url = "http://localhost:11434/api/tags"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        ollama_models = []
                        for model_data in data.get("models", []):
                            model_id = model_data['name']
                            display_name = model_id.split(':')[0]
                            # Calcula o tamanho em GB de forma segura
                            size_gb = model_data.get('size', 0) / (1024**3)
                            ollama_models.append(ModelConfig(
                                id=model_id,
                                name=f"{display_name.capitalize()} (Local)",
                                provider="ollama",
                                description=f"Modelo de {size_gb:.2f} GB"
                            ))
                        logger.info(f"Detectados {len(ollama_models)} modelos do Ollama.")
                        return ollama_models
                    else:
                        logger.warning(f"API do Ollama retornou status {response.status}.")
                        return []
        except aiohttp.ClientConnectorError:
            logger.warning("Não foi possível conectar à API do Ollama. O serviço está rodando?")
            return []
        except Exception as e:
            logger.error(f"Erro inesperado ao detectar modelos do Ollama via API: {e}")
            return []

    def add_remote_model(self, provider: str, api_key: str, model_id: str, name: str, api_model_name: str) -> tuple[bool, str]:
        if any(model.id.lower() == model_id.lower() for model in self.remote_models):
            msg = f"Modelo com ID '{model_id}' já existe."
            logger.warning(msg)
            return False, msg

        if any(model.name.lower() == f"{name} (API)".lower() for model in self.remote_models):
            msg = f"Modelo com nome de exibição '{name}' já existe."
            logger.warning(msg)
            return False, msg

        new_model = ModelConfig(
            id=model_id,
            name=f"{name} (API)",
            provider=provider,
            api_key=api_key,
            api_model_name=api_model_name
        )
        self.remote_models.append(new_model)
        self._save_user_config()
        msg = f"Modelo remoto {model_id} adicionado com sucesso."
        logger.info(msg)
        return True, msg

    def delete_remote_model(self, model_id: str) -> bool:
            initial_count = len(self.remote_models)
            self.remote_models = [model for model in self.remote_models if model.id != model_id]
            
            if len(self.remote_models) < initial_count:
                self._save_user_config()
                logger.info(f"Modelo remoto {model_id} removido.")
                return True
            else:
                logger.warning(f"Tentativa de remover modelo não encontrado: {model_id}")
            return False
            
    def update_remote_model(self, model_id_to_update: str, new_data: dict) -> tuple[bool, str]:
        model_to_update = next((model for model in self.remote_models if model.id == model_id_to_update), None)

        if not model_to_update:
            msg = f"Modelo com ID '{model_id_to_update}' não encontrado para atualização."
            logger.warning(msg)
            return False, msg

        new_name = f"{new_data['name']} (API)"
        if any(model.name.lower() == new_name.lower() and model.id != model_id_to_update for model in self.remote_models):
            msg = f"O nome de exibição '{new_data['name']}' já está em uso por outro modelo."
            logger.warning(msg)
            return False, msg

        model_to_update.name = new_name
        model_to_update.provider = new_data['provider']
        model_to_update.api_key = new_data['api_key']
        model_to_update.api_model_name = new_data['api_model_name']

        self._save_user_config()
        msg = f"Modelo {model_id_to_update} atualizado com sucesso."
        logger.info(msg)
        return True, msg

    async def get_unified_models_list(self) -> List[ModelConfig]:
        local_models = await self.discover_ollama_models()
        # self.remote_models já está preenchido pelo __init__
        all_models = local_models + self.remote_models
        return all_models