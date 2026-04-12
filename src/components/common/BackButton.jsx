import { Icon } from './Icon';

export const BackButton = ({ onClick, label = 'Back' }) => {
  return (
    <button className="back-btn" onClick={onClick}>
      <Icon name="arrow_left" size={16} />
      {label}
    </button>
  );
};