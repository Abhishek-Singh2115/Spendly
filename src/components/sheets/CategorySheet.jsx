import { CATEGORIES } from '../../utils/constants';

export const CategorySheet = ({ isOpen, onClose, selectedCategory, onSelect, excludeSalary = false }) => {
  if (!isOpen) return null;

  const categories = excludeSalary 
    ? CATEGORIES.filter(c => c.id !== 'salary')
    : CATEGORIES;

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
          Select Category
        </div>
        <div className="cat-grid">
          {categories.map(category => (
            <div
              key={category.id}
              className={`cat-item${selectedCategory === category.id ? ' selected' : ''}`}
              onClick={() => {
                onSelect(category.id);
                onClose();
              }}
            >
              <span className="cat-emoji">{category.emoji}</span>
              <span>{category.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};