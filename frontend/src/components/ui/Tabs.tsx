import React from 'react';
import { cn } from './cn';

type TabsValue = string;

const TabsContext = React.createContext<{
  value: TabsValue;
  onValueChange: (v: TabsValue) => void;
} | null>(null);

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: TabsValue;
  onValueChange: (v: TabsValue) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('inline-flex items-center gap-2 p-2 bg-gray-100 border border-gray-300 rounded-xl', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsTrigger({
  value,
  children,
}: {
  value: TabsValue;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');

  const active = value === ctx.value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors',
        active ? 'text-white bg-purple-600' : 'text-gray-600 hover:text-slate-900 bg-transparent',
      )}
    >
      {children}
    </button>
  );
}

