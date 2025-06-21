import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { loginStart, loginSuccess, loginFailure, selectAuthError } from '../../store/slices/authSlice';
import { api } from '../../services/api';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const error = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);
  
  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
    }),
    onSubmit: async (values) => {
      try {
        dispatch(loginStart());
        const response = await api.post('/auth/login', values);
        
        dispatch(loginSuccess({
          user: response.data.user,
          token: response.data.token,
        }));
        
        // Redirect to the intended page
        navigate(from, { replace: true });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
        dispatch(loginFailure(errorMessage));
      }
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        mx: 'auto',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" mb={3}>
          Sign in to your account to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email Address"
            margin="normal"
            variant="outlined"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            autoComplete="email"
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            variant="outlined"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ mt: 1, mb: 3, textAlign: 'right' }}>
            <Link
              component={RouterLink}
              to="/forgot-password"
              variant="body2"
              color="primary.main"
            >
              Forgot password?
            </Link>
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/register"
              variant="body2"
              color="primary.main"
              fontWeight="medium"
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;