import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';
import { selectIsAuthenticated, loginSuccess, logout } from '../../store/slices/authSlice';
import jwtDecode from 'jwt-decode';
import { api } from '../../services/api';

export const PrivateRoute: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const dispatch = useDispatch();
  const [isVerifying, setIsVerifying] = React.useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsVerifying(false);
        return;
      }
      
      try {
        // Check if token is expired
        const decodedToken: { exp: number } = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token is expired
          dispatch(logout());
          setIsVerifying(false);
          return;
        }
        
        // Verify token with backend
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        dispatch(loginSuccess({
          user: response.data,
          token,
        }));
      } catch (error) {
        console.error('Token verification error:', error);
        dispatch(logout());
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyToken();
  }, [dispatch]);
  
  if (isVerifying) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default PrivateRoute;