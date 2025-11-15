// LocalStorage management utilities

const STORAGE_KEY = 'oncloud_phase2_data';

// Save data to localStorage
export const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
};

// Load data from localStorage
export const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};

// Clear all data
export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
};

// Custom hook for localStorage
export const useLocalStorage = (initialData) => {
  const [data, setData] = React.useState(() => {
    const saved = loadFromStorage();
    return saved || initialData;
  });

  // Auto-save whenever data changes
  React.useEffect(() => {
    saveToStorage(data);
  }, [data]);

  return [data, setData];
};
