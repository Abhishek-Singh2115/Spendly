import { useState, useRef, useCallback } from 'react';

export const useToast = () => {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    setMessage(msg);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage(''), 2500);
  }, []);

  return { message, showToast };
};