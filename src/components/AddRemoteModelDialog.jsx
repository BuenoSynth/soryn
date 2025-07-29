import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { PasswordInput } from './PasswordInput';

const AddRemoteModelDialog = ({ isOpen, setIsOpen, onModelAdded }) => {
  const [provider, setProvider] = useState('openai');
  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !modelId || !apiKey) {
        setError('Todos os campos são obrigatórios.');
        return;
    }
    setIsSaving(true);
    setError('');

    try {
        const response = await fetch('http://localhost:5000/api/models/remote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider,
                api_key: apiKey,
                model_id: modelId,
                model_name: name,
                api_model_name: modelId,
            }),
        });

        // Verificamos se a resposta NÃO foi bem-sucedida (ex: erro 409, 500)          
        if (!response.ok) {
          // Lemos a mensagem de erro que o backend enviou no JSON
          const errorData = await response.json();
          throw new Error(errorData.erro || 'Ocorreu um erro desconhecido.');
        }
        // Se chegamos aqui, deu tudo certo
        await onModelAdded();
        setIsOpen(false);
        // Limpa o formulário para a próxima vez
        setName('');
        setModelId('');
        setApiKey('');
    } catch (err) {
      // Colocamos a mensagem de erro no estado para ser exibida na tela
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Modelo de API</DialogTitle>
          <DialogDescription>
            Configure o acesso a um modelo de IA remoto. Sua chave de API é armazenada localmente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provedor</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                  <SelectItem value="gemini">Google (Gemini)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome de Exibição</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Meu GPT-4o" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-id">ID do Modelo (API)</Label>
              <Input id="model-id" value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="Ex: gpt-4o-mini" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">Chave de API</Label>
              <PasswordInput 
                id="api-key"
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="sk-..."
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center pb-2">{error}</p>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Modelo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRemoteModelDialog;