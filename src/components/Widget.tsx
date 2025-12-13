import { ReactNode } from 'react';
import './Widget.css';

interface WidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  onClose: (id: string) => void;
  className?: string;
}

const Widget = ({ id, title, children, onClose, className = '' }: WidgetProps) => {
  return (
    <div className={`widget ${className}`}>
      <button
        className="widget-close"
        onClick={() => onClose(id)}
        aria-label="Close widget"
      >
        <span className="close-icon"></span>
      </button>
      <div className="widget-header">
        <h2>{title}</h2>
      </div>
      <div className="widget-content">
        {children}
      </div>
    </div>
  );
};

export default Widget;
