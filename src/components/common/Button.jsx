export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'default',
  fullWidth = false,
  icon,
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  const widthClass = fullWidth ? 'btn-full' : '';
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    widthClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};