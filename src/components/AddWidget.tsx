import { useState } from 'react';
import './Widget.css';

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface AddWidgetProps {
  availableWidgets: WidgetConfig[];
  activeWidgetIds: string[];
  onAdd: (widgetId: string) => void;
}

const AddWidget = ({ availableWidgets, activeWidgetIds, onAdd }: AddWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = (widgetId: string) => {
    onAdd(widgetId);
    setIsOpen(false);
  };

  return (
    <div className="add-widget-container">
      {!isOpen ? (
        <button
          className="add-widget-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Add widget"
        >
          <span className="add-widget-icon">+</span>
        </button>
      ) : (
        <div className="widget-picker">
          <div className="widget-picker-header">
            <h3>Add Widget</h3>
            <button
              className="widget-picker-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="widget-picker-list">
            {availableWidgets.map((widget) => {
              const isAdded = activeWidgetIds.includes(widget.id);
              return (
                <button
                  key={widget.id}
                  className="widget-picker-item"
                  onClick={() => handleAdd(widget.id)}
                  disabled={isAdded}
                >
                  <span className="widget-item-icon">{widget.icon}</span>
                  <div className="widget-item-info">
                    <p className="widget-item-name">{widget.name}</p>
                    <p className="widget-item-desc">{widget.description}</p>
                  </div>
                  {isAdded && <span className="widget-item-added">Added</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddWidget;
