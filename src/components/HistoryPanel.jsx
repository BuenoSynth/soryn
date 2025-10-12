import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageSquare, Bot, Trash2, Eye, Repeat, Loader2, History as HistoryIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// --- Componente de Overlay (sem alterações) ---
const ExpandedDetailsView = ({ isOpen, onClose, details, initialBounds, onDelete, onReuse, allModels = [] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isContentVisible, setIsContentVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const expandTimer = setTimeout(() => setIsExpanded(true), 10);
            const contentTimer = setTimeout(() => setIsContentVisible(true), 150);
            return () => {
                clearTimeout(expandTimer);
                clearTimeout(contentTimer);
            };
        } else {
            setIsContentVisible(false);
            setIsExpanded(false);
        }
    }, [isOpen]);
    
    if (!initialBounds) return null;

    const isChat = details?.type === 'chat';
    const messages = isChat && Array.isArray(details.messages) ? details.messages : [];
    const winnerResponse = !isChat && details && Array.isArray(details.responses) ? details.responses.find(r => r.model_id === details.winner_model_id) : null;
    
    const model = allModels.find(m => m.id === details?.model_id);
    const modelName = model?.name || details?.model_id;

    const style = {
        top: `${isExpanded ? '50%' : initialBounds.top + 'px'}`,
        left: `${isExpanded ? '50%' : initialBounds.left + 'px'}`,
        width: `${isExpanded ? 'min(90vw, 1000px)' : initialBounds.width + 'px'}`,
        height: `${isExpanded ? '85vh' : initialBounds.height + 'px'}`,
        transform: `translate(-50%, -50%) ${isExpanded ? 'scale(1)' : `scale(${initialBounds.width / 1000}, ${initialBounds.height / (window.innerHeight * 0.85)})`}`,
        transformOrigin: 'center center',
    };
    
    const transitionClasses = isExpanded
        ? 'duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'
        : 'duration-300 ease-in-out';

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 transition-colors",
                isOpen ? "bg-black/60 backdrop-blur-sm" : "bg-transparent pointer-events-none",
                isExpanded ? "duration-500" : "duration-300"
            )}
            onClick={onClose}
        >
            <div
                style={style}
                onClick={(e) => e.stopPropagation()}
                className={`fixed bg-card rounded-lg shadow-2xl overflow-hidden flex flex-col transition-all ${transitionClasses}`}
            >
                <div className={cn("flex flex-col h-full transition-opacity duration-300", isContentVisible ? "opacity-100" : "opacity-0")}>
                    <div className="p-4 border-b flex items-center justify-between flex-shrink-0 gap-4">
                        <div>
                             <h2 className="text-lg font-semibold capitalize">{details ? `${details.type}: ${details.title || details.prompt}` : 'Carregando...'}</h2>
                             {details && (
                                <div className="flex items-center flex-wrap gap-x-2 text-sm text-muted-foreground mt-1">
                                    <span>{new Date(details.created_at || details.timestamp).toLocaleString('pt-BR')}</span>
                                    {modelName && (
                                        <>
                                            <span className="text-muted-foreground/50">•</span>
                                            <span>{modelName}</span>
                                        </>
                                    )}
                                </div>
                             )}
                        </div>
                        <div className="flex items-center flex-shrink-0">
                             {details?.type === 'chat' && (
                                <Button variant="ghost" size="sm" onClick={onReuse} className="hidden sm:inline-flex gap-2">
                                    <Repeat className="w-4 h-4" /> Reutilizar
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={onDelete} className="hidden sm:inline-flex text-red-500 hover:text-red-500 hover:bg-red-500/10 gap-2">
                                <Trash2 className="w-4 h-4" /> Excluir
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="flex-1 p-4 md:p-6">
                       {!details ? (
                           <div className="flex items-center justify-center h-full">
                               <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                           </div>
                       ) : isChat ? (
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                                        {msg.role === 'assistant' && <Bot className="w-5 h-5 flex-shrink-0 mt-1 text-primary" />}
                                        <div className={cn("prose dark:prose-invert max-w-none text-sm max-w-[80%] rounded-lg p-3", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="space-y-4">
                                 <h3 className="font-semibold text-lg">Vencedor: {details.winner_model_id || 'N/A'}</h3>
                                 {details.evaluation_reasoning && <p className="text-sm text-muted-foreground italic">"{details.evaluation_reasoning}"</p>}
                                 {winnerResponse && (
                                     <Card className="bg-muted/50">
                                         <CardContent className="pt-6">
                                            <div className="prose dark:prose-invert max-w-none text-sm">
                                                <ReactMarkdown>{winnerResponse.response_text}</ReactMarkdown>
                                            </div>
                                         </CardContent>
                                     </Card>
                                 )}
                             </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};


// --- HistoryCard com a LÓGICA DE EXIBIÇÃO CORRIGIDA ---
const HistoryCard = ({ item, onSelect, onReuse, onDelete }) => {
    return (
        <Card className="flex flex-col justify-between group relative transition-all duration-300 hover:border-primary cursor-pointer" onClick={onSelect}>
            <CardHeader className="flex-row items-start justify-between gap-4 pb-2">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-muted rounded-full flex-shrink-0">
                        {item.type === 'chat' ? <MessageSquare className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className="overflow-hidden">
                        <CardTitle className="text-base truncate">{item.title}</CardTitle>
                        <CardDescription>
                            {new Date(item.sort_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4 px-4 flex items-center gap-1">
                 <div className="flex items-center ml-auto">
                    {item.type === 'chat' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onReuse(); }} title="Reutilizar Chat">
                            <Repeat className="w-4 h-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onSelect(e); }} title="Visualizar">
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Excluir">
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                 </div>
            </CardContent>
        </Card>
    );
};


const HistoryPanel = ({ onReuseChat, allModels = [] }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItemDetails, setSelectedItemDetails] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cardBounds, setCardBounds] = useState(null);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/history');
            if (!response.ok) throw new Error('Falha ao buscar histórico.');
            const data = await response.json();
            setHistory(data);
        } catch (error) {
            toast.error("Erro de Rede", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleViewDetails = async (item, event) => {
        const cardElement = event.currentTarget;
        if (!cardElement) return;
        
        setCardBounds(cardElement.getBoundingClientRect());
        setSelectedItemDetails(null);
        setIsModalOpen(true);

        try {
            const response = await fetch(`http://localhost:5000/api/history/${item.type}/${item.id}`);
            if (!response.ok) throw new Error('Falha ao buscar detalhes.');
            const data = await response.json();
            data.type = item.type;
            setSelectedItemDetails(data);
        } catch (error) {
            toast.error("Erro de Rede", { description: error.message });
            setIsModalOpen(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    useEffect(() => {
        if (!isModalOpen) {
            const timer = setTimeout(() => {
                setSelectedItemDetails(null);
                setCardBounds(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isModalOpen]);
    
    const handleDeleteItem = (item) => {
        toast("Tem certeza?", {
            description: `Deseja realmente excluir este ${item.type}?`,
            action: {
                label: "Confirmar",
                onClick: async () => {
                    try {
                        const response = await fetch(`http://localhost:5000/api/history/${item.type}/${item.id}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Falha ao excluir.');
                        toast.success(`${item.type.charAt(0).toUpperCase() + item.type.slice(1)} excluído com sucesso.`);
                        fetchHistory();
                    } catch (error) {
                        toast.error("Erro", { description: error.message });
                    }
                },
            },
            cancel: { label: "Cancelar" },
        });
    };
    
    const handleReuse = (item) => {
        if (item.type === 'chat') {
            onReuseChat(item.id);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <HistoryIcon className="w-6 h-6" />
                    Histórico de Atividades
                </h2>
                <p className="text-muted-foreground">Visualize ou continue suas conversas e debates passados.</p>
            </div>

            {history.length > 0 ? (
                <ScrollArea className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-4">
                        {history.map(item => {
                            // A API de lista não fornece o model_id, então modelName será undefined aqui.
                            // A lógica permanece para o caso da API mudar no futuro.
                            const model = allModels.find(m => m.id === item.model_id);
                            const modelName = model ? model.name : item.model_id;
                            
                            return (
                                <HistoryCard
                                    key={`${item.type}-${item.id}`}
                                    item={item}
                                    modelName={modelName}
                                    onSelect={(e) => handleViewDetails(item, e)}
                                    onReuse={() => handleReuse(item)}
                                    onDelete={() => handleDeleteItem(item)}
                                />
                            );
                        })}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <HistoryIcon className="w-12 h-12 mb-4" />
                    <h3 className="font-medium text-lg text-foreground">Nenhuma atividade encontrada</h3>
                    <p>Seu histórico de chats e debates aparecerá aqui.</p>
                </div>
            )}
            
            <ExpandedDetailsView
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                details={selectedItemDetails}
                initialBounds={cardBounds}
                allModels={allModels}
                onReuse={() => {
                    if (selectedItemDetails) handleReuse(selectedItemDetails);
                    handleCloseModal();
                }}
                onDelete={() => {
                    if (selectedItemDetails) handleDeleteItem(selectedItemDetails);
                    handleCloseModal();
                }}
            />
        </div>
    );
};

export default HistoryPanel;

