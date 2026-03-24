export const Calculator = ({ onDigit, onDot, onBackspace }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const handleClick = (key) => {
    if (key === '⌫') {
      onBackspace();
    } else if (key === '.') {
      onDot();
    } else {
      onDigit(key);
    }
  };

  return (
    <div className="calc-grid">
      {keys.map(key => (
        <button
          key={key}
          className={`calc-btn${key === '⌫' ? ' danger' : ''}`}
          onClick={() => handleClick(key)}
        >
          {key}
        </button>
      ))}
    </div>
  );
};