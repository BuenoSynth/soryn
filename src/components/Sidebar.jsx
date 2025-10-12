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
  HardDrive,
  MessageCircle,
  PanelLeftClose,
  PanelRightOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = ({ activeTab, onTabChange, className, isSidebarOpen, onToggleSidebar }) => {
  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'debate', label: 'Debate', icon: MessageSquare },
    { id: 'models', label: 'Modelos', icon: Bot },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'statistics', label: 'Estatísticas', icon: BarChart3 },
    { id: 'hardware', label: 'Hardware', icon: HardDrive },
    { id: 'themes', label: 'Temas', icon: Palette },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <Card className={cn(
      "h-full border-r bg-card/50 backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out",
      isSidebarOpen ? "w-64" : "w-20",
      className
    )}>
      <div className="p-4">
        <div className={cn(
          "flex items-center mb-8 h-8",
          isSidebarOpen ? "justify-between" : "justify-center"
        )}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                Soryn
              </h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onToggleSidebar}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>
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
                  activeTab === item.id && "bg-primary text-primary-foreground shadow-md",
                  !isSidebarOpen && "justify-center"
                )}
                onClick={() => onTabChange(item.id)}
                title={!isSidebarOpen ? item.label : ''}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </div>
    </Card>
  );
};

export default Sidebar;
