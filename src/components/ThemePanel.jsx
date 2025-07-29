import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor,
  Download,
  Upload,
  Sparkles,
  Eye,
  Type,
  Layout
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ThemePanel = () => {
  const [currentTheme, setCurrentTheme] = useState('system');
  const [fontSize, setFontSize] = useState([16]);
  const [animations, setAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  const themeOptions = [
    { id: 'light', name: 'Claro', icon: Sun, preview: 'bg-white border-gray-200' },
    { id: 'dark', name: 'Escuro', icon: Moon, preview: 'bg-gray-900 border-gray-700' },
    { id: 'system', name: 'Sistema', icon: Monitor, preview: 'bg-gradient-to-br from-white to-gray-100' }
  ];

  const colorSchemes = [
    { id: 'blue', name: 'Azul', colors: ['bg-blue-500', 'bg-blue-400', 'bg-blue-300'] },
    { id: 'purple', name: 'Roxo', colors: ['bg-purple-500', 'bg-purple-400', 'bg-purple-300'] },
    { id: 'green', name: 'Verde', colors: ['bg-green-500', 'bg-green-400', 'bg-green-300'] },
    { id: 'orange', name: 'Laranja', colors: ['bg-orange-500', 'bg-orange-400', 'bg-orange-300'] },
    { id: 'pink', name: 'Rosa', colors: ['bg-pink-500', 'bg-pink-400', 'bg-pink-300'] },
    { id: 'teal', name: 'Teal', colors: ['bg-teal-500', 'bg-teal-400', 'bg-teal-300'] }
  ];

  const presetThemes = [
    {
      id: 'professional',
      name: 'Profissional',
      description: 'Design limpo e minimalista para uso corporativo',
      preview: 'bg-gradient-to-br from-slate-50 to-slate-100'
    },
    {
      id: 'creative',
      name: 'Criativo',
      description: 'Cores vibrantes e elementos visuais expressivos',
      preview: 'bg-gradient-to-br from-purple-100 to-pink-100'
    },
    {
      id: 'focus',
      name: 'Foco',
      description: 'Interface minimalista para máxima concentração',
      preview: 'bg-gradient-to-br from-gray-50 to-gray-100'
    },
    {
      id: 'gaming',
      name: 'Gaming',
      description: 'Tema escuro com acentos neon',
      preview: 'bg-gradient-to-br from-gray-900 to-black'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Personalização Visual</h2>
        <p className="text-muted-foreground">
          Customize a aparência do Soryn de acordo com suas preferências
        </p>
      </div>

      {/* Tema Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Tema Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((theme) => {
              const Icon = theme.icon;
              return (
                <Button
                  key={theme.id}
                  variant={currentTheme === theme.id ? "default" : "outline"}
                  className="h-20 flex-col gap-2"
                  onClick={() => setCurrentTheme(theme.id)}
                >
                  <div className={cn("w-8 h-8 rounded border-2", theme.preview)} />
                  <div className="flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    <span className="text-xs">{theme.name}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Esquema de Cores */}
      <Card>
        <CardHeader>
          <CardTitle>Esquema de Cores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {colorSchemes.map((scheme) => (
              <Button
                key={scheme.id}
                variant="outline"
                className="h-16 flex-col gap-2 hover:scale-105 transition-transform"
              >
                <div className="flex gap-1">
                  {scheme.colors.map((color, index) => (
                    <div key={index} className={cn("w-4 h-4 rounded-full", color)} />
                  ))}
                </div>
                <span className="text-xs">{scheme.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Temas Predefinidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Temas Predefinidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {presetThemes.map((theme) => (
            <div
              key={theme.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-lg border-2", theme.preview)} />
                <div className="flex-1">
                  <h4 className="font-medium">{theme.name}</h4>
                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                </div>
                <Button variant="outline" size="sm">
                  Aplicar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Configurações Visuais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tamanho da Fonte */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <Label>Tamanho da Fonte</Label>
              <Badge variant="secondary">{fontSize[0]}px</Badge>
            </div>
            <Slider
              value={fontSize}
              onValueChange={setFontSize}
              max={24}
              min={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pequeno</span>
              <span>Médio</span>
              <span>Grande</span>
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <Label>Animações</Label>
              </div>
              <Switch
                checked={animations}
                onCheckedChange={setAnimations}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                <Label>Modo Compacto</Label>
              </div>
              <Switch
                checked={compactMode}
                onCheckedChange={setCompactMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Importar/Exportar */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Temas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2">
              <Upload className="w-4 h-4" />
              Importar Tema
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Exportar Tema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-card">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded" />
                <span className="font-medium">Exemplo de Interface</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Esta é uma prévia de como sua interface ficará com as configurações atuais.
              </p>
              <div className="flex gap-2">
                <Button size="sm">Botão Primário</Button>
                <Button variant="outline" size="sm">Botão Secundário</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemePanel;

