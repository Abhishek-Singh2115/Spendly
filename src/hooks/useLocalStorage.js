import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    return storage.get(key, initialValue);
  });

  useEffect(() => {
    storage.set(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};