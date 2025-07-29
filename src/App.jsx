import React, { useState, useEffect } from 'react';
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

  const fetchAllModels = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/models');
      if (!response.ok) throw new Error('Falha na rede ao buscar modelos');
      const data = await response.json();
      setAllModels(data);
    } catch (error) {
      console.error("Erro ao buscar a lista de modelos:", error);
    }
  };

  // <-- useEffect para chamar a função de busca uma vez quando o app abrir
  useEffect(() => {
    fetchAllModels();
  }, []); // O array vazio [] garante que isso só roda uma vez


  const handleModelDelete = async (modelIdToDelete) => {
    if (!window.confirm(`Tem certeza que deseja remover o modelo ${modelIdToDelete}?`)) {
      return;
    }

    // Guarda o estado atual caso a operação falhe e precisemos reverter
    const originalModels = [...allModels];
    const originalSelectedModels = [...selectedModels];

    // --- ATUALIZAÇÃO OTIMISTA ---
    // Remove o modelo da lista local IMEDIATAMENTE
    setAllModels(prev => prev.filter(model => model.id !== modelIdToDelete));
    setSelectedModels(prev => prev.filter(model => model.id !== modelIdToDelete));

    // --- SINCRONIZAÇÃO EM SEGUNDO PLANO ---
    try {
      const response = await fetch(`http://localhost:5000/api/models/remote/${modelIdToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        // Se a chamada falhar, joga um erro para ser pego pelo catch
        throw new Error('Falha ao remover o modelo no backend.');
      }
      // Se deu certo, não fazemos nada, pois a UI já foi atualizada.
      console.log(`Modelo ${modelIdToDelete} removido com sucesso no backend.`);

    } catch (error) {
      console.error("Erro ao remover modelo, revertendo a UI:", error);
      // Se a sincronização falhar, revertemos a UI para o estado original
      setAllModels(originalModels);
      setSelectedModels(originalSelectedModels);
      // Aqui poderíamos mostrar uma notificação de erro para o usuário
      alert("Não foi possível remover o modelo. Tente novamente.");
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
            onAddModelClick={() => setIsAddModalOpen(true)} // Função para abrir o Dialog
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={setIsAddModalOpen}
            onModelAdded={fetchAllModels}     // Função para ser chamada após adicionar um modelo
            onModelDelete={handleModelDelete} // Função para ser chamada após deletar um modelo
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
    </Layout>
  );
}

export default App;