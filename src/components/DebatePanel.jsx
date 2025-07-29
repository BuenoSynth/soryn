import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Bot, 
  Clock, 
  Trophy, 
  Loader2,
  MessageSquare,
  Sparkles
} from 'lucide-react';

  const DebatePanel = ({ selectedModels = [], onDebateStart }) => {
    const [prompt, setPrompt] = useState('');
    const [isDebating, setIsDebating] = useState(false);
    const [debateResult, setDebateResult] = useState(null);

  const handleStartDebate = async () => {
    if (!prompt.trim() || selectedModels.length < 2) return;

    setIsDebating(true);
    setDebateResult(null);

    try {
      const response = await fetch('http://localhost:5000/debate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          models: selectedModels.map((model) => model.id)
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao chamar a API de debate');
      }

      const data = await response.json();
      setDebateResult(data);
      if (onDebateStart) onDebateStart(data);
    } catch (error) {
      console.error('Erro durante o debate:', error);
    } finally {
      setIsDebating(false);
    }
  };


  const canStartDebate = prompt.trim() && selectedModels.length >= 2 && !isDebating;

  return (
    <div className="space-y-6">
      {/* Input de Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Nova Pergunta para Debate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite sua pergunta aqui. Os modelos selecionados irão debater e a melhor resposta será apresentada..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isDebating}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Modelos selecionados:
              </span>
              {selectedModels.length > 0 ? (
                <div className="flex gap-1">
                  {selectedModels.map((model) => (
                    <Badge key={model.id} variant="secondary" className="text-xs">
                      {model.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Nenhum modelo selecionado
                </span>
              )}
            </div>
            
            <Button 
              onClick={handleStartDebate}
              disabled={!canStartDebate}
              className="gap-2"
            >
              {isDebating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Debatendo...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Iniciar Debate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado do Debate */}
      {isDebating && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Debate em andamento...</p>
                <p className="text-sm text-muted-foreground">
                  Os modelos estão processando sua pergunta
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {debateResult && !isDebating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Resultado do Debate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resposta Vencedora */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Melhor Resposta
                </span>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {selectedModels.find(m => m.id === debateResult.winner_model_id)?.name}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-green-900 dark:text-green-100">
                {debateResult.winner_response}
              </p>
            </div>

            <Separator />

            {/* Estatísticas do Debate */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{debateResult.total_time_ms}ms</p>
                <p className="text-xs text-muted-foreground">Tempo Total</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{debateResult.responses.length}</p>
                <p className="text-xs text-muted-foreground">Modelos</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {debateResult.responses.filter(r => r.success).length}
                </p>
                <p className="text-xs text-muted-foreground">Sucessos</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Vencedor</p>
              </div>
            </div>

            {/* Botão para Ver Detalhes */}
            <Button variant="outline" className="w-full">
              Ver Todas as Respostas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instruções quando não há modelos */}
      {selectedModels.length < 2 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Selecione pelo menos 2 modelos</h3>
              <p className="text-sm text-muted-foreground">
                Vá para a aba "Modelos" para selecionar os modelos de IA que participarão do debate.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DebatePanel;