import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner'; // Importa o Toaster
import { toast } from 'sonner'; // Importa a função de toast
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import DebatePanel from './components/DebatePanel';
import ModelsPanel from './components/ModelsPanel';
import ThemePanel from './components/ThemePanel';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('debate');
  const [selectedModels, setSelectedModels] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);

  const fetchAllModels = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/models');
      if (!response.ok) throw new Error('Falha na rede ao buscar modelos');
      const data = await response.json();
      setAllModels(data);
    } catch (error) {
      console.error("Erro ao buscar a lista de modelos:", error);
      toast.error("Erro de Rede", { description: "Não foi possível carregar a lista de modelos." });
    }
  };

  useEffect(() => {
    fetchAllModels();
  }, []);

  const handleModelDelete = async (modelIdToDelete) => {
    if (!window.confirm(`Tem certeza que deseja remover o modelo ${modelIdToDelete}?`)) {
      return;
    }
    const originalModels = [...allModels];
    const originalSelectedModels = [...selectedModels];
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
      // Substituindo o 'alert' por um 'toast' de erro
      toast.error("Falha ao Remover", { description: "Não foi possível remover o modelo. Tente novamente." });
    }
  };

  const handleModelToggle = (model) => {
    setSelectedModels(prev => {
      const isSelected = prev.some(m => m.id === model.id);
      if (isSelected) {
        return prev.filter(m => m.id !== model.id);
      } else {
        return [...prev, model];
      }
    });
  };

  // Funções para controlar o Dialog de Adicionar/Editar/Fechar
  const handleOpenAddModel = () => {
    setEditingModel(null); // Garante que não estamos em modo de edição
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (model) => {
    setEditingModel(model); // Guarda os dados do modelo para edição
    setIsAddModalOpen(true); // Abre o mesmo Dialog
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingModel(null); // Limpa o estado de edição ao fechar
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'debate':
        return <DebatePanel selectedModels={selectedModels} />;
      case 'models':
        return (
          <ModelsPanel
            allModels={allModels}
            selectedModels={selectedModels}
            onModelToggle={handleModelToggle}
            onAddModelClick={handleOpenAddModel}
            onModelEdit={handleOpenEditModal}  
            onModelDelete={handleModelDelete}
            // Passa o controle e os dados para o Dialog
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={handleCloseModal}
            editingModel={editingModel}
            onModelAdded={fetchAllModels}
          />
        );
      case 'themes':
        return <ThemePanel />;
      case 'history':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Histórico de Debates</h3>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      case 'statistics':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Estatísticas</h3>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      case 'hardware':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Informações de Hardware</h3>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Configurações</h3>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      default:
        return <DebatePanel selectedModels={selectedModels} />;
    }
  };

  return (
    <Layout>
      <div className="flex h-screen">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
      <Toaster richColors position="top-right" /> {/* Componente do Toaster adicionado */}
    </Layout>
  );
}

export default App;