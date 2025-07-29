import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Bot, Trash2, Pencil } from 'lucide-react';
import AddRemoteModelDialog from './AddRemoteModelDialog';

const ModelsPanel = ({
  allModels = [],
  selectedModels = [],
  onModelToggle,
  onAddModelClick,
  isAddModalOpen,
  setIsAddModalOpen,
  onModelAdded,
  onModelDelete
}) => {
  
  const isModelSelected = (modelId) => {
    return selectedModels.some(model => model.id === modelId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Modelos de IA</h2>
          <p className="text-muted-foreground">
            Gerencie e selecione os modelos que participarão dos debates
          </p>
        </div>
        <Button className="gap-2" onClick={onAddModelClick}>
          <Plus className="w-4 h-4" />
          Adicionar Modelo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Modelos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {allModels.length > 0 ? (
            allModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={isModelSelected(model.id)}
                onToggle={() => onModelToggle(model)}
                onDelete={() => onModelDelete(model.id)} // Passa a função de delete para o card
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="mx-auto h-8 w-8 mb-2" />
              Nenhum modelo encontrado. Verifique se o Ollama está rodando ou adicione um modelo de API.
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddRemoteModelDialog
        isOpen={isAddModalOpen}
        setIsOpen={setIsAddModalOpen}
        onModelAdded={onModelAdded}
      />
    </div>
  );
};

const ModelCard = ({ model, isSelected, onToggle, onDelete }) => {
  return (
    <div className="p-4 border rounded-lg transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2 pr-4">
          <h3 className="font-medium">{model.name}</h3>
          <p className="text-sm text-muted-foreground">{model.description}</p>
          <Badge variant="outline">{model.provider}</Badge>
        </div>
        <div className="flex items-center space-x-4">
            {model.provider !== 'ollama' && (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert('Função de editar a ser implementada!')}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                    </Button>
                </div>
            )}
            <Switch
                checked={isSelected}
                onCheckedChange={onToggle}
                disabled={!model.is_available}
            />
        </div>
      </div>
    </div>
  );
};

export default ModelsPanel;