import React, { useState, useEffect } from 'react'; // importado o useEffect
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import DebatePanel from './components/DebatePanel';
import ModelsPanel from './components/ModelsPanel';
import ThemePanel from './components/ThemePanel';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('debate'); // Aba que abre quando entra no site
  const [selectedModels, setSelectedModels] = useState([]);
  
  // <-- Estado para guardar a lista de TODOS os modelos do backend
  const [allModels, setAllModels] = useState([]);

  // <-- Função que busca os modelos da nossa API em Python
  const fetchAllModels = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/models');
      if (!response.ok) {
        throw new Error('Falha ao buscar modelos do backend.');
      }
      const data = await response.json();
      setAllModels(data); // Armazena a lista no nosso estado
    } catch (error) {
      console.error("Erro fatal ao buscar modelos:", error);
      // O ideal aqui seria mostrar uma mensagem de erro na tela
    }
  };

  // <-- useEffect para chamar a função de busca uma vez quando o app abrir
  useEffect(() => {
    fetchAllModels();
  }, []); // O array vazio [] garante que isso só roda uma vez

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
        return (
          <DebatePanel 
            selectedModels={selectedModels}
            onDebateStart={(result) => console.log('Debate result:', result)}
          />
        );
      case 'models':
        return (
          <ModelsPanel 
            // <-- Passando a lista completa de modelos para o painel
            allModels={allModels}
            selectedModels={selectedModels}
            onModelToggle={handleModelToggle}
          />
        );
      // ... o resto do seu switch case continua igual
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