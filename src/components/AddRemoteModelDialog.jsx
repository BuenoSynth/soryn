import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PasswordInput } from './PasswordInput';

const AddRemoteModelDialog = ({ isOpen, setIsOpen, onModelAdded, editingModel }) => {
  const [provider, setProvider] = useState('openai');
  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editingModel;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setName(editingModel.name.replace(' (API)', ''));
        setProvider(editingModel.provider);
        setModelId(editingModel.id);
        setApiKey(editingModel.api_key);
      } else {
        setName('');
        setProvider('openai');
        setModelId('');
        setApiKey('');
      }
      setError('');
    }
  }, [editingModel, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !apiKey || (isEditing ? !editingModel.id : !modelId)) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    setIsSaving(true);
    setError('');

    const url = isEditing
      ? `http://localhost:5000/api/models/remote/${editingModel.id}`
      : 'http://localhost:5000/api/models/remote';
    const method = isEditing ? 'PUT' : 'POST';

    const body = {
      provider,
      api_key: apiKey,
      model_id: isEditing ? editingModel.id : modelId,
      name: name,
      api_model_name: isEditing ? editingModel.api_model_name : modelId,
    };

    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Ocorreu um erro.');
      }
      await onModelAdded();
      setIsOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Modelo de API' : 'Adicionar Modelo de API'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações do seu modelo de API.' : 'Configure o acesso a um novo modelo de IA remoto.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provedor</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input id="model-id" value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="Ex: gpt-4o-mini" disabled={isEditing} />
              {isEditing && <p className="text-xs text-muted-foreground">O ID do modelo não pode ser alterado após a criação.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">Chave de API</Label>
              <PasswordInput id="api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 text-center pb-2">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isEditing ? 'Salvar Alterações' : 'Adicionar Modelo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRemoteModelDialog;