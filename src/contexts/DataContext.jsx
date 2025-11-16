import React, { createContext, useContext, useReducer, useEffect } from 'react';

const DataContext = createContext();

// Data reducer
const dataReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        vendors: action.payload.vendors || {},
        employees: action.payload.employees || {},
        users: action.payload.users || {},
        loading: false
      };
    
    // Vendor actions
    case 'ADD_VENDOR':
      return {
        ...state,
        vendors: {
          ...state.vendors,
          [action.payload.id]: action.payload
        }
      };
    
    case 'UPDATE_VENDOR':
      return {
        ...state,
        vendors: {
          ...state.vendors,
          [action.payload.id]: {
            ...state.vendors[action.payload.id],
            ...action.payload
          }
        }
      };
    
    case 'DELETE_VENDOR':
      const { [action.payload]: removedVendor, ...remainingVendors } = state.vendors;
      return {
        ...state,
        vendors: remainingVendors
      };
    
    // Employee actions
    case 'ADD_EMPLOYEE':
      return {
        ...state,
        employees: {
          ...state.employees,
          [action.payload.empId]: action.payload
        }
      };
    
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: {
          ...state.employees,
          [action.payload.empId]: {
            ...state.employees[action.payload.empId],
            ...action.payload
          }
        }
      };
    
    case 'DELETE_EMPLOYEE':
      const { [action.payload]: removedEmployee, ...remainingEmployees } = state.employees;
      return {
        ...state,
        employees: remainingEmployees
      };
    
    // User actions
    case 'ADD_USER':
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.username]: action.payload
        }
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.username]: {
            ...state.users[action.payload.username],
            ...action.payload
          }
        }
      };
    
    case 'DELETE_USER':
      const { [action.payload]: removedUser, ...remainingUsers } = state.users;
      return {
        ...state,
        users: remainingUsers
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  vendors: {},
  employees: {},
  users: {},
  loading: true
};

// Provider component
export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('masterData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: data });
      } catch (error) {
        console.error('Failed to parse saved data:', error);
        dispatch({ type: 'LOAD_DATA', payload: {} });
      }
    } else {
      dispatch({ type: 'LOAD_DATA', payload: {} });
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (!state.loading) {
      const dataToSave = {
        vendors: state.vendors,
        employees: state.employees,
        users: state.users
      };
      localStorage.setItem('masterData', JSON.stringify(dataToSave));
    }
  }, [state.vendors, state.employees, state.users, state.loading]);

  const value = {
    vendors: state.vendors,
    employees: state.employees,
    users: state.users,
    loading: state.loading,
    dispatch
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
