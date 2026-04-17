import { SPLIT_METHODS } from '../../utils/constants';

const METHOD_COLORS = {
  equal: { bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)', accent: 'var(--green)' },
  exact: { bg: 'rgba(99,102,241,.12)', border: 'rgba(99,102,241,.3)', accent: 'var(--accent)' },
  percentage: { bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)', accent: 'var(--yellow)' },
  shares: { bg: 'rgba(236,72,153,.12)', border: 'rgba(236,72,153,.3)', accent: '#ec4899' },
};

export const SplitMethodSheet = ({ isOpen, onClose, selectedMethod, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{
          fontFamily: 'var(--font-head)', fontWeight: 700,
          marginBottom: 4, fontSize: 20
        }}>
          How to split?
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
          Choose how to divide the expense
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SPLIT_METHODS.map(method => {
            const isSelected = selectedMethod === method.id;
            const colors = METHOD_COLORS[method.id];
            return (
              <div
                key={method.id}
                onClick={() => { onSelect(method.id); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                  background: isSelected ? colors.bg : 'var(--card2)',
                  border: `1.5px solid ${isSelected ? colors.border : 'var(--border)'}`,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: isSelected ? colors.bg : 'var(--card)',
                  border: `1px solid ${isSelected ? colors.border : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0
                }}>
                  {method.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: isSelected ? colors.accent : 'var(--text)',
                    marginBottom: 2
                  }}>
                    {method.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                    {method.desc}
                  </div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid ${isSelected ? colors.accent : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease', flexShrink: 0
                }}>
                  {isSelected && (
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: colors.accent
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};