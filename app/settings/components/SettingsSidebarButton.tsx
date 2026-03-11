import { cn } from '@/lib/utils';
import React from 'react';

interface Props extends React.ComponentProps<'button'> {
  className?: string;
  children: React.ReactNode;
}

const SettingsSidebarButton = ({ className, children, ...props }: Props) => {
  return (
    <button
      className={cn(
        'hover:bg-card hover:text-card-foreground flex w-full cursor-pointer justify-start rounded-lg border p-2 pl-8',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default SettingsSidebarButton;
