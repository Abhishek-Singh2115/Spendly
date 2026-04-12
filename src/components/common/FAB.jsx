import { Icon } from './Icon';

export const FAB = ({ onClick, icon = 'plus', style = {} }) => {
  return (
    <button 
      className="fab" 
      onClick={onClick}
      style={style}
    >
      <Icon name={icon} size={26} color="#fff" />
    </button>
  );
};