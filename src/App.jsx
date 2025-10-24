import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import DebatePanel from './components/DebatePanel';
import ModelsPanel from './components/ModelsPanel';
import ThemePanel from './components/ThemePanel';
import ChatPanel from './components/ChatPanel';
import HistoryPanel from './components/HistoryPanel';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedModels, setSelectedModels] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [historyToLoad, setHistoryToLoad] = useState(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // <<< ADIÇÃO: Estados para o modal de confirmação de exclusão
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState(null); // Armazena o ID do modelo

  const fetchAllModels = async () => {
    // Na primeira vez, garantimos que o estado de loading está ativo.
    // Nas chamadas subsequentes (refresh), ele já estará como 'false'.
    if (isLoadingModels === false) {
      // Para o botão de refresh, podemos ter um loading visual específico se quisermos,
      // mas o principal é garantir que a carga inicial seja gerenciada.
    }

    try {
      const response = await fetch('http://localhost:5000/api/models');
      if (!response.ok) throw new Error('Falha na rede ao buscar modelos');
      const data = await response.json();
      setAllModels(data);
    } catch (error) {
      console.error("Erro ao buscar a lista de modelos:", error);
      toast.error("Erro de Rede", { description: "Não foi possível carregar a lista de modelos." });
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchAllModels();
  }, []);

  const handleReuseChat = async (chatId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/history/chat/${chatId}`);
        if (!response.ok) throw new Error('Falha ao buscar detalhes do chat.');
        const chatData = await response.json();
        setHistoryToLoad(chatData);
        setActiveTab('chat');
    } catch (error) {
        toast.error("Erro", { description: error.message });
    }
  };

  // <<< ALTERAÇÃO: 'handleModelDelete' agora se chama 'promptModelDelete'
  // Esta função agora APENAS abre o modal de confirmação.
  const promptModelDelete = (modelIdToDelete) => {
    setModelToDelete(modelIdToDelete); // Salva o ID do modelo
    setIsConfirmModalOpen(true);    // Abre o modal
  };

  // <<< ADIÇÃO: Nova função para a lógica de exclusão, chamada pelo modal
  const handleConfirmDelete = async () => {
    if (!modelToDelete) return;

    const modelIdToDelete = modelToDelete; // Pega o ID salvo
    const originalModels = [...allModels];
    const originalSelectedModels = [...selectedModels];
    
    // Otimistic UI update
    setAllModels(prev => prev.filter(model => model.id !== modelIdToDelete));
    setSelectedModels(prev => prev.filter(model => model.id !== modelIdToDelete));

    try {
      const response = await fetch(`http://localhost:5000/api/models/remote/${modelIdToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Falha ao remover o modelo no backend.');
      }
      toast.success("Modelo Removido", { description: `O modelo ${modelIdToDelete} foi removido com sucesso.` });
    } catch (error) {
      console.error("Erro ao remover modelo, revertendo a UI:", error);
      setAllModels(originalModels);
      setSelectedModels(originalSelectedModels);
      toast.error("Falha ao Remover", { description: "Não foi possível remover o modelo. Tente novamente." });
    } finally {
      // Fecha o modal e limpa o estado
      setIsConfirmModalOpen(false);
      setModelToDelete(null);
    }
  };
  
  // <<< O 'handleModelDelete' original (que usava toast de confirmação) foi substituído

  const handleModelToggle = (model) => {
    setSelectedModels(prev => {
      const isSelected = prev.some(m => m.id === model.id);
      return isSelected ? prev.filter(m => m.id !== model.id) : [...prev, model];
    });
  };

  const handleOpenAddModel = () => {
    setEditingModel(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (model) => {
    setEditingModel(model);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingModel(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatPanel 
                  allModels={allModels} 
                  initialHistory={historyToLoad}
                  onHistoryLoaded={() => setHistoryToLoad(null)}
                />;
      case 'history':
        return <HistoryPanel onReuseChat={handleReuseChat} allModels={allModels} />;
      default:
        return (
          <div className="p-6 h-full overflow-y-auto">
            {(() => {
              switch (activeTab) {
                case 'debate':
                  return <DebatePanel 
                            selectedModels={selectedModels} 
                            allModels={allModels}
                            onModelToggle={handleModelToggle}
                            isLoadingModels={isLoadingModels}
                          />;
                case 'models':
                  return (
                    <ModelsPanel
                      allModels={allModels}
                      selectedModels={selectedModels}
                      onModelToggle={handleModelToggle}
                      onAddModelClick={handleOpenAddModel}
                      onModelEdit={handleOpenEditModal}
                      // <<< ALTERAÇÃO: Passa a nova função 'promptModelDelete'
                      onModelDelete={promptModelDelete}
                      isAddModalOpen={isAddModalOpen}
                      setIsAddModalOpen={handleCloseModal}
                      editingModel={editingModel}
                      onModelAdded={fetchAllModels}
                      isLoadingModels={isLoadingModels}
                    />
                  );
                case 'themes':
                  return <ThemePanel />;
                default:
                  return (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                      <p className="text-muted-foreground">Em desenvolvimento...</p>
                    </div>
                  );
              }
            })()}
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="flex h-screen bg-muted/40">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-hidden">
          {renderContent()}

          {/* <<< ADIÇÃO: O AlertDialog para confirmar a exclusão do modelo */}
          <AlertDialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Deseja realmente remover o modelo <strong>{modelToDelete}</strong>?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setModelToDelete(null)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleConfirmDelete} 
                  variant="destructive"
                >
                  Confirmar Remoção
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </main>
      </div>
    </Layout>
  );
}

export default App;
