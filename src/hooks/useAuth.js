// src/hooks/useAuth.js

import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

// Custom Hook for Auth Context
const useAuth = () => useContext(AuthContext);

export default useAuth;
