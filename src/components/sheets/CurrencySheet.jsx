import { CURRENCIES } from '../../utils/constants';

export const CurrencySheet = ({ isOpen, onClose, selectedCurrency, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '100px'
        }}
      >
        <div className="sheet-handle" />

        <div style={{
          fontFamily: 'var(--font-head)',
          fontWeight: 700,
          marginBottom: 16,
          fontSize: 18
        }}>
          Select Currency
        </div>

        <div className="radio-group">
          {CURRENCIES.map(currency => (
            <div
              key={currency.code}
              className={`radio-option${selectedCurrency === currency.code ? ' selected' : ''}`}
              onClick={() => {
                onSelect(currency.code);
                onClose();
              }}
            >
              <span style={{
                fontSize: 22,
                fontFamily: 'var(--font-head)',
                fontWeight: 700,
                width: 32,
                textAlign: 'center',
                color: 'var(--accent)'
              }}>
                {currency.symbol}
              </span>

              <div className="radio-dot" />

              <div>
                <div className="radio-label">{currency.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {currency.code}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};