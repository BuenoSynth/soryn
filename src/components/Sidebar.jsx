import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  MessageSquare, 
  Settings, 
  History, 
  BarChart3, 
  Bot,
  Palette,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = ({ activeTab, onTabChange, className }) => {
  const menuItems = [
    { id: 'debate', label: 'Debate', icon: MessageSquare },
    { id: 'models', label: 'Modelos', icon: Bot },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'statistics', label: 'Estatísticas', icon: BarChart3 },
    { id: 'hardware', label: 'Hardware', icon: HardDrive },
    { id: 'themes', label: 'Temas', icon: Palette },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <Card className={cn("w-64 h-full border-r bg-card/50 backdrop-blur-sm", className)}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Soryn
          </h1>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  activeTab === item.id && "bg-primary text-primary-foreground shadow-md"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </Card>
  );
};

export default Sidebar;

