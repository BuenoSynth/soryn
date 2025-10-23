import os
import asyncio
import aiohttp
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import logging

# Importa as bibliotecas oficiais
import openai
import google.generativeai as genai

from models_manager import ModelConfig
from dotenv import load_dotenv
load_dotenv(dotenv_path='src-python/.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class InferenceRequest:
    """Requisição de inferência para um modelo."""
    model_id: str
    prompt: str
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    system_prompt: Optional[str] = None

@dataclass
class InferenceResponse:
    """Resposta de inferência de um modelo."""
    model_id: str
    response_text: str
    tokens_used: int
    inference_time_ms: int
    success: bool
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class AIInference:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=300))
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session: await self.session.close()

    async def infer_single(self, request: InferenceRequest, model_config: ModelConfig) -> InferenceResponse:
        start_time = asyncio.get_event_loop().time()
        try:
            # O dispatcher agora tem mais opções
            if model_config.provider == "ollama":
                response = await self._infer_ollama_api(request, model_config)
            elif model_config.provider == "openai":
                response = await self._infer_openai_sdk(request, model_config)
            elif model_config.provider == "gemini":
                response = await self._infer_gemini_sdk(request, model_config)
            else:
                raise ValueError(f"Provedor de modelo não suportado: {model_config.provider}")
            
            end_time = asyncio.get_event_loop().time()
            response.inference_time_ms = int((end_time - start_time) * 1000)
            return response
        except Exception as e:
            end_time = asyncio.get_event_loop().time()
            logger.error(f"Erro na inferência do modelo {request.model_id}: {e}")
            return InferenceResponse(
                model_id=request.model_id, response_text="", tokens_used=0,
                inference_time_ms=int((end_time - start_time) * 1000),
                success=False, error_message=str(e)
            )

    async def _infer_ollama_api(self, request: InferenceRequest, model_config: ModelConfig) -> InferenceResponse:
        model_name = model_config.id
        logger.info(f"Iniciando inferência via API do Ollama para o modelo: {model_name}")
        url = "http://localhost:11434/api/generate"
        payload = {"model": model_name, "prompt": request.prompt, "stream": False}
        async with self.session.post(url, json=payload) as response:
            if response.status == 200:
                data = await response.json()
                return InferenceResponse(
                    model_id=request.model_id,
                    response_text=data.get("response", "").strip(),
                    tokens_used=data.get("eval_count", 0),
                    inference_time_ms=0, success=True, metadata={"provider": "ollama_api"}
                )
            else:
                error_text = await response.text()
                raise Exception(f"Erro da API do Ollama: {error_text}")

    async def _infer_openai_sdk(self, request: InferenceRequest, model_config: ModelConfig) -> InferenceResponse:
        """Executa inferência usando a biblioteca oficial da OpenAI."""
        logger.info(f"Iniciando inferência com SDK da OpenAI para o modelo: {model_config.id}")
        
        api_key = model_config.api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(f"Chave de API da OpenAI não encontrada para o modelo '{model_config.id}'")
        
        client = openai.AsyncOpenAI(api_key=api_key)

        completion = await client.chat.completions.create(
            model=model_config.api_model_name or model_config.id,
            messages=[{"role": "user", "content": request.prompt}]
        )
        return InferenceResponse(
            model_id=request.model_id,
            response_text=completion.choices[0].message.content,
            tokens_used=completion.usage.total_tokens,
            inference_time_ms=0, success=True, metadata={"provider": "openai"}
        )

    async def _infer_gemini_sdk(self, request: InferenceRequest, model_config: ModelConfig) -> InferenceResponse:
        """TEMPLATE: Executa inferência usando a biblioteca oficial do Google Gemini."""
        logger.info(f"Iniciando inferência com SDK do Gemini para o modelo: {model_config.id}")

        api_key = model_config.api_key or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(f"Chave de API do Gemini não encontrada para o modelo '{model_config.id}'")

        genai.configure(api_key=api_key)

        model = genai.GenerativeModel(model_config.api_model_name or model_config.id)
        response = await model.generate_content_async(request.prompt)

        return InferenceResponse(
            model_id=request.model_id,
            response_text=response.text,
            tokens_used=response.usage_metadata.total_token_count,
            inference_time_ms=0, success=True, metadata={"provider": "gemini"}
        )

    async def infer_multiple(self, request: InferenceRequest, model_configs: List[ModelConfig]) -> List[InferenceResponse]:
        tasks = []
        for model_config in model_configs:
            model_request = InferenceRequest(model_id=model_config.id, prompt=request.prompt)
            task = asyncio.create_task(self.infer_single(model_request, model_config))
            tasks.append(task)
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        processed_responses = []
        for i, res in enumerate(responses):
            if isinstance(res, Exception):
                model_config = model_configs[i]
                processed_responses.append(InferenceResponse(
                    model_id=model_config.id, response_text="", tokens_used=0,
                    inference_time_ms=0, success=False, error_message=str(res)
                ))
            else:
                processed_responses.append(res)
        return processed_responses