import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Loader2, Sparkles, Copy, Check, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Componente para um único balão de mensagem
const Message = ({ role, content, isLastAssistantMessage, onRegenerate }) => {
  const [hasCopied, setHasCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  // Funções de placeholder para feedback
  const handleFeedback = (type) => {
    // TODO: Implementar lógica de feedback (ex: enviar para um endpoint)
    console.log(`Feedback: ${type}, Message: ${content.substring(0, 20)}...`);
    toast.success("Feedback enviado", { description: "Obrigado por ajudar a melhorar o Soryn." });
  }

  const isUser = role === 'user';
  
  return (
    <div className={cn("flex items-start gap-4 w-full max-w-4xl mx-auto", isUser ? "justify-end" : "justify-start")}>
      {!isUser && <div className="p-2 bg-muted rounded-full flex-shrink-0"><Bot className="w-5 h-5" /></div>}
      
      <div className={cn("max-w-[85%] rounded-lg p-3 relative group", isUser ? "bg-primary text-primary-foreground" : "bg-card border")}>
        <div className="prose dark:prose-invert max-w-none text-base leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        
        {/* MUDANÇA: Contêiner para múltiplos botões de ação */}
        {!isUser && (
          // <div className="absolute bottom--1 left-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute top-full left-2 mt-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
              {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedback('like')}>
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedback('dislike')}>
              <ThumbsDown className="w-4 h-4" />
            </Button>
            {/* Botão de Regenerar só aparece na última mensagem da IA */}
            {isLastAssistantMessage && onRegenerate && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRegenerate}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            )}
          </div>
        )}
      </div>
      
      {isUser && <div className="p-2 bg-muted rounded-full flex-shrink-0"><User className="w-5 h-5" /></div>}
    </div>
  );
};

const ChatPanel = ({ allModels = [], initialHistory, onHistoryLoaded }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModelId, setSelectedModelId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        // Este efeito só deve agir se 'initialHistory' for fornecido.
        if (initialHistory) {
            setMessages(initialHistory.messages || []);
            setSelectedModelId(initialHistory.model_id);
            setCurrentChatId(initialHistory.id);
            onHistoryLoaded();
        }
    }, [initialHistory, onHistoryLoaded]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
        }
    }, [prompt]);

    // ADIÇÃO: Lógica de fetch refatorada
    const fetchAssistantResponse = async (promptToSend) => {
        if (!promptToSend.trim() || !selectedModelId) return;
        
        setIsLoading(true);
        
        const apiBody = {
            model_id: selectedModelId,
            prompt: promptToSend,
            chat_id: currentChatId
        };
        
        try {
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiBody)
            });

            if (!response.ok) throw new Error('Erro na resposta da API');
            
            const data = await response.json();
            
            const assistantMessage = { role: 'assistant', content: data.response };
            setMessages(prev => [...prev, assistantMessage]);
            
            if (!currentChatId) {
                setCurrentChatId(data.chat_id);
            }

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            const errorMessage = { role: 'assistant', content: `**Erro:** Não foi possível obter uma resposta. Tente novamente. (${error.message})` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        const currentPrompt = prompt;
        setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
        setPrompt('');
        await fetchAssistantResponse(currentPrompt);
    };

    // ADIÇÃO: Lógica para Regenerar
    const handleRegenerate = async () => {
        const lastUserMessage = messages.findLast(m => m.role === 'user');
        if (!lastUserMessage) return;

        // Encontra o índice da última mensagem de *assistente*
        const lastAssistantMessageIndex = messages.findLastIndex(m => m.role === 'assistant');
        if (lastAssistantMessageIndex === -1) return;

        // Remove a última resposta do assistente (e qualquer possível erro)
        setMessages(prev => prev.slice(0, lastAssistantMessageIndex));
        
        // Re-envia o último prompt do usuário
        await fetchAssistantResponse(lastUserMessage.content);
    };
    
    const availableModels = allModels.filter(m => m.is_available);
    const canSendMessage = prompt.trim() && selectedModelId && !isLoading;

    const selectedModel = allModels.find(m => m.id === selectedModelId);

    return (
        <div className="flex flex-col h-[calc(100vh-3rem)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground max-w-4xl mx-auto">
                  <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-medium text-foreground mb-2">Como posso ajudar?</h2>
                  <p className="mb-8">Selecione um modelo abaixo para começar.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                    {availableModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModelId(model.id)}
                        className={cn("p-4 border rounded-lg text-left transition-all duration-200 flex flex-col items-start gap-2", selectedModelId === model.id ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "hover:border-primary/50 hover:bg-muted/50")}>
                        <Bot className="w-5 h-5 text-primary"/>
                        <span className="font-semibold text-foreground">{model.name}</span>
                        <span className="text-xs text-muted-foreground uppercase">{model.provider}</span>
                      </button>
                    ))}
                  </div>
              </div>
            ) : (
                messages.map((msg, index) => (
                    <Message 
                        key={index} 
                        role={msg.role} 
                        content={msg.content} 
                        isLastAssistantMessage={msg.role === 'assistant' && index === messages.length - 1 && !isLoading}
                        onRegenerate={handleRegenerate}
                    />
                ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="px-4 pb-6 pt-2 w-full max-w-4xl mx-auto">
            
            {selectedModel && !isLoading && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
                  <Bot className="w-4 h-4" />
                  <span>Conversando com: <strong>{selectedModel.name}</strong></span>
              </div>
            )}
            
            <div className="relative">
              <div className={cn(
                "flex items-end gap-2 rounded-2xl border p-3 shadow-lg",
                isLoading ? "bg-muted/50" : "bg-input"
              )}>
                  <Textarea
                    ref={textareaRef}
                    placeholder={selectedModelId ? "Pergunte qualquer coisa..." : "Selecione um modelo acima para começar"}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-transparent border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base max-h-48 placeholder:text-muted-foreground/80"
                    rows={1}
                    disabled={isLoading || !selectedModelId}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if(canSendMessage) handleSendMessage();
                        }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!canSendMessage} size="icon" className="rounded-full flex-shrink-0 w-10 h-10">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
              </div>
            </div>
          </div>
        </div>
    );
};

export default ChatPanel;