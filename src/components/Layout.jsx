import React from 'react';
import { cn } from '@/lib/utils';

const Layout = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      {children}
    </div>
  );
};

export default Layout;

