import { Icon } from './Icon';
import { NAV_ITEMS } from '../../utils/constants';

export const BottomNav = ({ active, onChange }) => {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`nav-item${active === item.id ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          <Icon name={item.icon} size={22} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};