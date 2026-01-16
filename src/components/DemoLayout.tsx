import { ReactNode } from 'react';
import './DemoLayout.css';

interface DemoLayoutProps {
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
  controls?: ReactNode;
  info?: ReactNode;
}

export function DemoLayout({ title, description, onBack, children, controls, info }: DemoLayoutProps) {
  return (
    <div className="demo-layout">
      <header className="demo-layout__header">
        <button className="demo-layout__back" onClick={onBack}>
          ← Back to Demos
        </button>
        <div className="demo-layout__title-group">
          <h1 className="demo-layout__title">{title}</h1>
          <p className="demo-layout__description">{description}</p>
        </div>
      </header>
      <main className="demo-layout__main">
        <div className="demo-layout__content">
          {children}
        </div>
        {(controls || info) && (
          <div className="demo-layout__sidebar">
            {controls && <div className="demo-layout__controls">{controls}</div>}
            {info && <div className="demo-layout__info">{info}</div>}
          </div>
        )}
      </main>
    </div>
  );
}
