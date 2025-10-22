import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
    Send, 
    Bot, 
    Clock, 
    Trophy, 
    Loader2,
    MessageSquare,
    Sparkles,
    Copy,
    Check,
    Users,
    ChevronsUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DebatePanel = ({ selectedModels = [], allModels = [], onModelToggle, isLoadingModels }) => {
    const [prompt, setPrompt] = useState('');
    const [isDebating, setIsDebating] = useState(false);
    const [debateResult, setDebateResult] = useState(null);
    const [copiedResponseId, setCopiedResponseId] = useState(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const handleStartDebate = async () => {
        if (!prompt.trim() || selectedModels.length < 2) return;
        setIsDebating(true);
        setDebateResult(null);
        try {
            const response = await fetch('http://localhost:5000/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    models: selectedModels.map((model) => model.id)
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || 'Erro ao chamar a API de debate');
            }
            const data = await response.json();
            setDebateResult(data);
        } catch (error) {
            console.error('Erro durante o debate:', error);
        } finally {
            setIsDebating(false);
        }
    };

    const handleCopy = (textToCopy, responseId) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedResponseId(responseId);
            setTimeout(() => setCopiedResponseId(null), 2000);
        });
    };

    const formatTime = (ms) => {
        if (ms === null || ms === undefined) return '0s';
        const seconds = ms / 1000;
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return `${minutes}m ${remainingSeconds}s`;
        }
    };

    const canStartDebate = prompt.trim() && selectedModels.length >= 2 && !isDebating;

    const renderModelSelectionContent = () => {
        if (isLoadingModels) {
            return (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8 flex items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                            <h3 className="font-medium">Carregando modelos...</h3>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (allModels.length === 0) {
            return (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">Nenhum modelo encontrado</h3>
                            <p className="text-sm text-muted-foreground">
                                Verifique se o Ollama está rodando ou adicione um modelo na aba "Modelos".
                            </p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (selectedModels.length < 2) {
             return (
                 <Card>
                     <CardContent className="pt-6">
                         <div className="text-center py-8">
                             <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                             <h3 className="font-medium mb-2">Selecione os participantes</h3>
                             <p className="text-sm text-muted-foreground">
                                 Clique no botão "Selecionar modelos..." acima para escolher pelo menos 2 IAs para o debate.
                             </p>
                         </div>
                     </CardContent>
                 </Card>
             );
        }

        return null;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Nova Pergunta para Debate
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="Digite sua pergunta aqui..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[120px] resize-none"
                        disabled={isDebating}
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isSelectorOpen}
                                    className="w-[250px] justify-between"
                                    disabled={isLoadingModels || allModels.length === 0}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    {selectedModels.length > 0 ? `${selectedModels.length} modelo(s) selecionado(s)` : "Selecionar modelos..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar modelo..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {allModels.map((model) => {
                                                const isSelected = selectedModels.some(m => m.id === model.id);
                                                return (
                                                    <CommandItem
                                                        key={model.id}
                                                        onSelect={() => onModelToggle(model)}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                                        {model.name}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        
                        <Button onClick={handleStartDebate} disabled={!canStartDebate} className="gap-2">
                            {isDebating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {isDebating ? 'Debatendo...' : 'Iniciar Debate'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isDebating && (
                <Card>
                    <CardContent className="pt-6 flex items-center justify-center space-x-4 py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="font-medium">Debate em andamento...</p>
                    </CardContent>
                </Card>
            )}

            {debateResult && !isDebating && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Resultado do Debate
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                                    <p className="text-2xl font-bold">{formatTime(debateResult.total_time_ms)}</p>
                                    <p className="text-xs text-muted-foreground">Tempo Total</p>
                                </div>
                                <div>
                                    <Bot className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                                    <p className="text-2xl font-bold">{debateResult.responses.length}</p>
                                    <p className="text-xs text-muted-foreground">Modelos</p>
                                </div>
                                <div>
                                    <MessageSquare className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                                    <p className="text-2xl font-bold">{debateResult.responses.filter(r => r.success).length}</p>
                                    <p className="text-xs text-muted-foreground">Sucessos</p>
                                </div>
                                <div>
                                    <Trophy className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                                    <p className="text-2xl font-bold">1</p>
                                    <p className="text-xs text-muted-foreground">Vencedor</p>
                                </div>
                            </div>
                            <Separator />
                            <p className="text-sm text-muted-foreground text-center">
                                {debateResult.evaluation_reasoning}
                            </p>
                        </CardContent>
                    </Card>

                    {debateResult.responses.map((response, index) => {
                        const isWinner = response.model_id === debateResult.winner_model_id;
                        const modelDetails = selectedModels.find(m => m.id === response.model_id);

                        return (
                            <Card 
                                key={index} 
                                className={cn("transition-all", isWinner && "border-green-500 ring-2 ring-green-500/50")}
                            >
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bot className="w-5 h-5" />
                                        <CardTitle className="text-lg">{modelDetails?.name || response.model_id}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8"
                                            onClick={() => handleCopy(response.response_text, response.model_id)}
                                        >
                                            {copiedResponseId === response.model_id ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                        {isWinner && (
                                            <Badge variant="default" className="bg-green-600 gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                Vencedor
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {response.success ? (
                                        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {response.response_text}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-red-500">
                                            Falha na geração da resposta: {response.error_message}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {!isDebating && !debateResult && renderModelSelectionContent()}
        </div>
    );
};

export default DebatePanel;