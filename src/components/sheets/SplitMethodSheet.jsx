import { SPLIT_METHODS } from '../../utils/constants';

export const SplitMethodSheet = ({ isOpen, onClose, selectedMethod, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{
          fontFamily: 'var(--font-head)',
          fontWeight: 700,
          marginBottom: 16,
          fontSize: 18
        }}>
          Split Method
        </div>
        <div className="radio-group">
          {SPLIT_METHODS.map(method => (
            <div
              key={method.id}
              className={`radio-option${selectedMethod === method.id ? ' selected' : ''}`}
              onClick={() => {
                onSelect(method.id);
                onClose();
              }}
            >
              <span style={{ fontSize: 20 }}>{method.icon}</span>
              <div className="radio-dot" />
              <div>
                <div className="radio-label">{method.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {method.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};