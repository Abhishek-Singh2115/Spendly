const THEMES = [
  { id: 'dark', label: 'Dark Mode', icon: '🌙', desc: 'Easy on the eyes at night' },
  { id: 'light', label: 'Light Mode', icon: '☀️', desc: 'Bright and clean' },
  { id: 'system', label: 'System Default', icon: '💻', desc: 'Follows your device setting' },
];

export const ThemeSheet = ({ isOpen, onClose, selectedTheme, onSelect }) => {
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
          Choose Theme
        </div>

        <div className="radio-group">
          {THEMES.map(theme => (
            <div
              key={theme.id}
              className={`radio-option${selectedTheme === theme.id ? ' selected' : ''}`}
              onClick={() => {
                onSelect(theme.id);
                onClose();
              }}
            >
              <span style={{ fontSize: 20 }}>{theme.icon}</span>
              <div className="radio-dot" />
              <div>
                <div className="radio-label">{theme.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {theme.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};