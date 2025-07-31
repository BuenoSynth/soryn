import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider'; // Importa nosso hook

const ThemePanel = () => {
  // Usa o hook para obter o tema atual e a função para mudá-lo
  const { theme: currentTheme, setTheme } = useTheme();

  const themeOptions = [
    { id: 'light', name: 'Claro', icon: Sun },
    { id: 'dark', name: 'Escuro', icon: Moon },
    { id: 'system', name: 'Sistema', icon: Monitor }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Personalização Visual</h2>
        <p className="text-muted-foreground">
          Customize a aparência do Soryn de acordo com suas preferências
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Tema Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione o tema visual para a interface. "Sistema" usará a preferência do seu sistema operacional.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((theme) => {
              const Icon = theme.icon;
              return (
                <Button
                  key={theme.id}
                  variant={currentTheme === theme.id ? "default" : "outline"}
                  className="h-24 flex-col gap-2"
                  onClick={() => setTheme(theme.id)} // Chama a função do provedor
                >
                  <Icon className="w-6 h-6" />
                  <span>{theme.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* As outras seções (Esquema de Cores, etc.) serão implementadas futuramente */}
      {/* Vamos focar em fazer o tema base funcionar perfeitamente antes de adicionar demais funcionalidades*/}

    </div>
  );
};

export default ThemePanel;