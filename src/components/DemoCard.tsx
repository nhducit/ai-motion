import { ReactNode } from 'react';
import './DemoCard.css';

interface DemoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  category: 'vision' | 'text' | 'audio';
  onClick: () => void;
}

export function DemoCard({ title, description, icon, category, onClick }: DemoCardProps) {
  return (
    <div className={`demo-card demo-card--${category}`} onClick={onClick}>
      <div className="demo-card__icon">{icon}</div>
      <div className="demo-card__content">
        <h3 className="demo-card__title">{title}</h3>
        <p className="demo-card__description">{description}</p>
      </div>
      <div className="demo-card__category">{category}</div>
    </div>
  );
}
