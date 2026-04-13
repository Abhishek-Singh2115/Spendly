import { useState } from 'react';
import { Icon } from '../common/Icon';
import { storage } from '../../utils/storage';

export const AddFriendSheet = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [recentFriends] = useState(() => storage.get('sp_friends', []));

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!name.trim()) {
      return;
    }
    
    const friend = {
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
    };

    // Save to recent friends
    const friends = storage.get('sp_friends', []);
    if (!friends.find(f => f.email === friend.email)) {
      friends.unshift(friend);
      storage.set('sp_friends', friends.slice(0, 20)); // Keep last 20
    }

    onAdd(friend);
    setName('');
    setEmail('');
    onClose();
  };

  const handleQuickAdd = (friend) => {
    onAdd(friend);
    onClose();
  };

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
          Add Friend
        </div>

        <div className="input-group">
          <label>Name *</label>
          <input
            className="input"
            placeholder="Friend's name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="input-group">
          <label>Email (optional)</label>
          <input
            className="input"
            type="email"
            placeholder="friend@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={handleAdd}
          disabled={!name.trim()}
        >
          <Icon name="plus" size={16} /> Add Friend
        </button>

        {recentFriends.length > 0 && (
          <>
            <div style={{
              fontSize: 12,
              color: 'var(--muted)',
              fontWeight: 600,
              marginTop: 20,
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '.05em'
            }}>
              Recent Friends
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentFriends.slice(0, 5).map((friend, index) => (
                <button
                  key={index}
                  className="btn btn-ghost btn-full"
                  onClick={() => handleQuickAdd(friend)}
                  style={{ justifyContent: 'flex-start', gap: 10 }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--card2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700
                  }}>
                    {friend.name[0].toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{friend.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{friend.email}</div>
                  </div>
                  <Icon name="plus" size={16} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};