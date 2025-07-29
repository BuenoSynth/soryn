import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Bot } from 'lucide-react';

// O componente agora recebe 'allModels' via props e não tem mais dados 'chumbados'
const ModelsPanel = ({ allModels = [], selectedModels = [], onModelToggle }) => {

  const isModelSelected = (modelId) => {
    return selectedModels.some(model => model.id === modelId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Modelos de IA</h2>
          <p className="text-muted-foreground">
            Selecione os modelos que participarão dos debates
          </p>
        </div>
        <Button className="gap-2">
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
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="mx-auto h-8 w-8 mb-2" />
              Nenhum modelo encontrado. Verifique se o Ollama está rodando.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ModelCard = ({ model, isSelected, onToggle }) => {
  const canBeToggled = model.is_available;

  return (
    <div className="p-4 border rounded-lg transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2 pr-4">
          <h3 className="font-medium">{model.name}</h3>
          <p className="text-sm text-muted-foreground">{model.description}</p>
          <Badge variant="outline">{model.provider}</Badge>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Switch
            checked={isSelected}
            onCheckedChange={onToggle}
            disabled={!canBeToggled}
          />
          {!canBeToggled && (
            <span className="text-xs text-red-500">Indisponível</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelsPanel;