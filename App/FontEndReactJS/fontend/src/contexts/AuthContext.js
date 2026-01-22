//AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Kiểm tra token có trong localStorage chưa
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Kiểm tra token còn hạn không
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp > currentTime) {
          const userData = {
            id: decodedToken.user_id,
            username: decodedToken.username,
            isAdmin: decodedToken.is_admin 
          };
          setCurrentUser(userData);
          
          // Thiết lập token cho axios
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // Token hết hạn
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("JWT decode error:", error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);
  
  const login = async (username, password) => {
    try {
      setError('');
      const response = await axios.post('http://localhost:5000/auth/login', {
        username,
        password
      });
      
      const { token, user } = response.data;
      
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin
      };
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(userData);
      return true;
    } catch (error) {
      if (error.response) {
        setError(error.response.data.error || 'Đăng nhập thất bại');
      } else {
        setError('Không thể kết nối đến server');
      }
      return false;
    }
  };
  
  const register = async (username, email, password) => {
    try {
      setError('');
      const response = await axios.post('http://localhost:5000/auth/register', {
        username,
        email,
        password
      });
      
      return true;
    } catch (error) {
      if (error.response) {
        setError(error.response.data.error || 'Đăng ký thất bại');
      } else {
        setError('Không thể kết nối đến server');
      }
      return false;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };
  
  const value = {
    currentUser,
    login,
    register,
    logout,
    error
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};