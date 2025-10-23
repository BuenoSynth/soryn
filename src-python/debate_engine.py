"""
Motor de debate entre modelos de IA para o Soryn.
Responsável por orquestrar debates e avaliar respostas.
"""

import asyncio
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from datetime import datetime

from models_manager import ModelConfig, ModelsManager
from ai_inference import AIInference, InferenceRequest, InferenceResponse

# Configuração de logging
logger = logging.getLogger(__name__)

class EvaluationCriteria(Enum):
    """Critérios de avaliação para respostas."""
    CLARITY = "clarity"
    DETAIL_LEVEL = "detail_level"
    TONE = "tone"
    CREATIVITY = "creativity"
    ACCURACY = "accuracy"
    RELEVANCE = "relevance"
    COMPLETENESS = "completeness"

@dataclass
class DebateRequest:
    """Requisição de debate entre modelos."""
    prompt: str
    model_ids: List[str]
    evaluation_criteria: Dict[str, Any]
    system_prompt: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None

@dataclass
class DebateResponse:
    """Resposta individual de um modelo no debate."""
    model_id: str
    model_name: str
    response_text: str
    tokens_used: int
    inference_time_ms: int
    success: bool
    error_message: Optional[str] = None
    evaluation_scores: Optional[Dict[str, float]] = None

@dataclass
class DebateResult:
    """Resultado completo de um debate."""
    debate_id: str
    timestamp: datetime
    prompt: str
    system_prompt: Optional[str]
    evaluation_criteria: Dict[str, Any]
    responses: List[DebateResponse]
    winner_model_id: Optional[str]
    winner_response: Optional[str]
    evaluation_reasoning: Optional[str]
    total_time_ms: int

class ResponseEvaluator:
    """Avaliador de respostas baseado em critérios personalizados."""
    
    def __init__(self):
        self.evaluation_weights = {
            EvaluationCriteria.CLARITY: 0.2,
            EvaluationCriteria.DETAIL_LEVEL: 0.15,
            EvaluationCriteria.TONE: 0.1,
            EvaluationCriteria.CREATIVITY: 0.1,
            EvaluationCriteria.ACCURACY: 0.2,
            EvaluationCriteria.RELEVANCE: 0.15,
            EvaluationCriteria.COMPLETENESS: 0.1
        }
    
    def evaluate_response(self, response_text: str, criteria: Dict[str, Any]) -> Dict[str, float]:
        """Avalia uma resposta baseada nos critérios especificados."""
        scores = {}
        
        # Análise de clareza (baseada em estrutura e legibilidade)
        clarity_score = self._evaluate_clarity(response_text)
        scores[EvaluationCriteria.CLARITY.value] = clarity_score
        
        # Análise de nível de detalhe
        detail_score = self._evaluate_detail_level(response_text, criteria.get('detail_level', 'medium'))
        scores[EvaluationCriteria.DETAIL_LEVEL.value] = detail_score
        
        # Análise de tom
        tone_score = self._evaluate_tone(response_text, criteria.get('tone', 'neutral'))
        scores[EvaluationCriteria.TONE.value] = tone_score
        
        # Análise de criatividade
        creativity_score = self._evaluate_creativity(response_text)
        scores[EvaluationCriteria.CREATIVITY.value] = creativity_score
        
        # Análise de relevância (baseada em palavras-chave)
        relevance_score = self._evaluate_relevance(response_text, criteria.get('keywords', []))
        scores[EvaluationCriteria.RELEVANCE.value] = relevance_score
        
        # Análise de completude
        completeness_score = self._evaluate_completeness(response_text, criteria.get('expected_topics', []))
        scores[EvaluationCriteria.COMPLETENESS.value] = completeness_score
        
        return scores
    
    def _evaluate_clarity(self, text: str) -> float:
        """Avalia a clareza do texto."""
        # Métricas simples de clareza
        sentences = text.split('.')
        avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        
        # Penaliza frases muito longas ou muito curtas
        if 10 <= avg_sentence_length <= 25:
            length_score = 1.0
        elif 5 <= avg_sentence_length < 10 or 25 < avg_sentence_length <= 35:
            length_score = 0.7
        else:
            length_score = 0.4
        
        # Verifica presença de estrutura (parágrafos, listas)
        structure_score = 0.5
        if '\n' in text:
            structure_score += 0.3
        if any(marker in text for marker in ['1.', '2.', '-', '*']):
            structure_score += 0.2
        
        return min((length_score + structure_score) / 2, 1.0)
    
    def _evaluate_detail_level(self, text: str, desired_level: str) -> float:
        """Avalia se o nível de detalhe corresponde ao desejado."""
        word_count = len(text.split())
        
        level_ranges = {
            'low': (0, 100),
            'medium': (100, 300),
            'high': (300, 1000),
            'very_high': (1000, float('inf'))
        }
        
        target_range = level_ranges.get(desired_level, level_ranges['medium'])
        
        if target_range[0] <= word_count <= target_range[1]:
            return 1.0
        elif target_range[0] * 0.7 <= word_count <= target_range[1] * 1.3:
            return 0.7
        else:
            return 0.3
    
    def _evaluate_tone(self, text: str, desired_tone: str) -> float:
        """Avalia se o tom corresponde ao desejado."""
        text_lower = text.lower()
        
        tone_indicators = {
            'formal': ['portanto', 'contudo', 'ademais', 'outrossim', 'destarte'],
            'informal': ['cara', 'galera', 'tipo', 'né', 'beleza'],
            'friendly': ['obrigado', 'espero', 'ajudar', 'prazer', 'fico feliz'],
            'professional': ['análise', 'estratégia', 'implementação', 'otimização', 'eficiência'],
            'creative': ['imagine', 'criativo', 'inovador', 'único', 'original']
        }
        
        indicators = tone_indicators.get(desired_tone, [])
        if not indicators:
            return 0.5  # Neutro se tom não reconhecido
        
        matches = sum(1 for indicator in indicators if indicator in text_lower)
        return min(matches / max(len(indicators) * 0.3, 1), 1.0)
    
    def _evaluate_creativity(self, text: str) -> float:
        """Avalia a criatividade da resposta."""
        # Métricas simples de criatividade
        creative_words = ['inovador', 'criativo', 'único', 'original', 'imagine', 'visualize', 'exemplo', 'metáfora']
        text_lower = text.lower()
        
        creativity_score = 0.0
        
        # Presença de palavras criativas
        creative_matches = sum(1 for word in creative_words if word in text_lower)
        creativity_score += min(creative_matches * 0.1, 0.3)
        
        # Uso de exemplos ou analogias
        if any(marker in text_lower for marker in ['por exemplo', 'imagine', 'como se', 'similar a']):
            creativity_score += 0.3
        
        # Variedade de vocabulário (aproximação simples)
        words = text_lower.split()
        unique_words = len(set(words))
        vocabulary_diversity = unique_words / max(len(words), 1)
        creativity_score += min(vocabulary_diversity, 0.4)
        
        return min(creativity_score, 1.0)
    
    def _evaluate_relevance(self, text: str, keywords: List[str]) -> float:
        """Avalia a relevância baseada em palavras-chave."""
        if not keywords:
            return 0.8  # Score neutro se não há palavras-chave
        
        text_lower = text.lower()
        matches = sum(1 for keyword in keywords if keyword.lower() in text_lower)
        
        return min(matches / len(keywords), 1.0)
    
    def _evaluate_completeness(self, text: str, expected_topics: List[str]) -> float:
        """Avalia se a resposta aborda os tópicos esperados."""
        if not expected_topics:
            return 0.8  # Score neutro se não há tópicos esperados
        
        text_lower = text.lower()
        covered_topics = sum(1 for topic in expected_topics if topic.lower() in text_lower)
        
        return min(covered_topics / len(expected_topics), 1.0)
    
    def calculate_overall_score(self, scores: Dict[str, float], criteria: Dict[str, Any]) -> float:
        """Calcula o score geral baseado nos pesos dos critérios."""
        # Usa pesos personalizados se fornecidos, senão usa padrões
        weights = criteria.get('weights', {})
        
        total_score = 0.0
        total_weight = 0.0
        
        for criterion, score in scores.items():
            weight = weights.get(criterion, self.evaluation_weights.get(EvaluationCriteria(criterion), 0.1))
            total_score += score * weight
            total_weight += weight
        
        return total_score / max(total_weight, 1.0)

class DebateEngine:
    """Motor principal de debate entre modelos de IA."""
    
    def __init__(self, models_manager: ModelsManager):
        self.models_manager = models_manager
        self.evaluator = ResponseEvaluator()
        self.debate_history: List[DebateResult] = []

    # Adicionado a função para o modo de chat.
    async def run_single_inference(self, request: InferenceRequest, model_config: ModelConfig) -> InferenceResponse:
        """
        Executa uma inferência para um único modelo, bypassando a lógica de debate.
        Ideal para a funcionalidade de chat.
        """
        logger.info(f"Iniciando inferência única para o modelo {request.model_id}")
        
        # A classe AIInference é um gerenciador de contexto assíncrono
        async with AIInference() as inference_engine:
            # Chama o método que realmente executa a chamada de API
            response = await inference_engine.infer_single(request, model_config)
        
        return response

    async def conduct_debate(self, request: DebateRequest) -> DebateResult:
        """Conduz um debate entre os modelos especificados."""
        start_time = time.time()
        debate_id = f"debate_{int(start_time)}"
        
        logger.info(f"Iniciando debate {debate_id} com {len(request.model_ids)} modelos")
        
        # 1. Pede ao gerenciador a lista unificada e atualizada de TODOS os modelos.
        all_available_models = await self.models_manager.get_unified_models_list()
        
        # 2. Cria um dicionário para busca rápida (id -> config).
        models_map = {model.id: model for model in all_available_models}

        # 3. Valida os modelos solicitados para o debate contra a lista que acabamos de obter.
        model_configs = []
        for model_id in request.model_ids:
            config = models_map.get(model_id) # Usa o dicionário para a busca
            if not config:
                # Este erro agora é mais preciso, pois sabemos que o modelo não está na lista unificada.
                raise ValueError(f"Modelo não encontrado ou indisponível: {model_id}")
            if not config.is_available:
                raise ValueError(f"Modelo não disponível: {model_id}")
            model_configs.append(config)
        
        responses = await self._execute_inferences(request, model_configs)
        # Avalia respostas
        evaluated_responses = self._evaluate_responses(responses, request.evaluation_criteria)
        
        # Determina vencedor
        winner_model_id, winner_response, reasoning = self._determine_winner(evaluated_responses)
        
        end_time = time.time()
        total_time_ms = int((end_time - start_time) * 1000)
        
        # Cria resultado do debate
        result = DebateResult(
            debate_id=debate_id,
            timestamp=datetime.now(),
            prompt=request.prompt,
            system_prompt=request.system_prompt,
            evaluation_criteria=request.evaluation_criteria,
            responses=evaluated_responses,
            winner_model_id=winner_model_id,
            winner_response=winner_response,
            evaluation_reasoning=reasoning,
            total_time_ms=total_time_ms
        )
        
        # Adiciona ao histórico
        self.debate_history.append(result)
        
        logger.info(f"Debate {debate_id} concluído em {total_time_ms}ms. Vencedor: {winner_model_id}")
        
        return result
    
    async def _execute_inferences(self, request: DebateRequest, model_configs: List[ModelConfig]) -> List[DebateResponse]:
        """Executa inferências em todos os modelos."""
        async with AIInference() as ai_inference:
            # Cria requisição de inferência
            inference_request = InferenceRequest(
                model_id="",  # Será preenchido para cada modelo
                prompt=request.prompt,
                system_prompt=request.system_prompt,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )
            
            # Executa inferências em paralelo
            inference_responses = await ai_inference.infer_multiple(inference_request, model_configs)
            
            # Converte para DebateResponse
            debate_responses = []
            for inference_response, model_config in zip(inference_responses, model_configs):
                debate_response = DebateResponse(
                    model_id=inference_response.model_id,
                    model_name=model_config.name,
                    response_text=inference_response.response_text,
                    tokens_used=inference_response.tokens_used,
                    inference_time_ms=inference_response.inference_time_ms,
                    success=inference_response.success,
                    error_message=inference_response.error_message
                )
                debate_responses.append(debate_response)
            
            return debate_responses
    
    def _evaluate_responses(self, responses: List[DebateResponse], criteria: Dict[str, Any]) -> List[DebateResponse]:
        """Avalia todas as respostas baseado nos critérios."""
        for response in responses:
            if response.success:
                scores = self.evaluator.evaluate_response(response.response_text, criteria)
                response.evaluation_scores = scores
            else:
                response.evaluation_scores = {}
        
        return responses
    
    def _determine_winner(self, responses: List[DebateResponse]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Determina o vencedor do debate."""
        successful_responses = [r for r in responses if r.success and r.evaluation_scores]
        
        if not successful_responses:
            return None, None, "Nenhuma resposta válida foi gerada"
        
        # Calcula scores gerais
        scored_responses = []
        for response in successful_responses:
            overall_score = self.evaluator.calculate_overall_score(
                response.evaluation_scores, 
                {}  # Usa pesos padrão
            )
            scored_responses.append((response, overall_score))
        
        # Ordena por score (maior primeiro)
        scored_responses.sort(key=lambda x: x[1], reverse=True)
        
        winner_response, winner_score = scored_responses[0]
        
        # Gera reasoning
        reasoning = f"Modelo {winner_response.model_name} venceu com score {winner_score:.3f}. "
        if len(scored_responses) > 1:
            second_score = scored_responses[1][1]
            reasoning += f"Segundo lugar: {scored_responses[1][0].model_name} com score {second_score:.3f}."
        
        return winner_response.model_id, winner_response.response_text, reasoning
    
    def get_debate_history(self, limit: Optional[int] = None) -> List[DebateResult]:
        """Retorna o histórico de debates."""
        if limit:
            return self.debate_history[-limit:]
        return self.debate_history.copy()
    
    def get_debate_by_id(self, debate_id: str) -> Optional[DebateResult]:
        """Retorna um debate específico pelo ID."""
        for debate in self.debate_history:
            if debate.debate_id == debate_id:
                return debate
        return None
    
    def export_debate_history(self, filepath: str) -> bool:
        """Exporta o histórico de debates para um arquivo JSON."""
        try:
            export_data = []
            for debate in self.debate_history:
                # Converte datetime para string para serialização JSON
                debate_dict = asdict(debate)
                debate_dict['timestamp'] = debate.timestamp.isoformat()
                export_data.append(debate_dict)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Histórico de debates exportado para {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao exportar histórico: {e}")
            return False
    
    def clear_history(self) -> None:
        """Limpa o histórico de debates."""
        self.debate_history.clear()
        logger.info("Histórico de debates limpo")
    
    def get_model_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas dos modelos baseadas no histórico."""
        stats = {}
        
        for debate in self.debate_history:
            for response in debate.responses:
                model_id = response.model_id
                
                if model_id not in stats:
                    stats[model_id] = {
                        'total_debates': 0,
                        'wins': 0,
                        'avg_inference_time': 0,
                        'total_tokens': 0,
                        'success_rate': 0,
                        'avg_scores': {}
                    }
                
                model_stats = stats[model_id]
                model_stats['total_debates'] += 1
                
                if debate.winner_model_id == model_id:
                    model_stats['wins'] += 1
                
                if response.success:
                    model_stats['avg_inference_time'] += response.inference_time_ms
                    model_stats['total_tokens'] += response.tokens_used
                    
                    # Acumula scores para média
                    if response.evaluation_scores:
                        for criterion, score in response.evaluation_scores.items():
                            if criterion not in model_stats['avg_scores']:
                                model_stats['avg_scores'][criterion] = []
                            model_stats['avg_scores'][criterion].append(score)
        
        # Calcula médias
        for model_id, model_stats in stats.items():
            total_debates = model_stats['total_debates']
            if total_debates > 0:
                model_stats['win_rate'] = model_stats['wins'] / total_debates
                model_stats['avg_inference_time'] = model_stats['avg_inference_time'] / total_debates
                
                # Calcula médias dos scores
                for criterion, scores in model_stats['avg_scores'].items():
                    model_stats['avg_scores'][criterion] = sum(scores) / len(scores)
        
        return stats

