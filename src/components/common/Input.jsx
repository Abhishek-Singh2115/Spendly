export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input
        className={`input ${className}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {error && (
        <div style={{ 
          color: 'var(--red)', 
          fontSize: 12, 
          marginTop: 4 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};