import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import theme from './theme';
import { store } from './store';

// Layout
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Main Pages
import Dashboard from './pages/Dashboard';
import Studios from './pages/studios/Studios';
import StudioDetail from './pages/studios/StudioDetail';
import Bookings from './pages/bookings/Bookings';
import BookingDetail from './pages/bookings/BookingDetail';
import CreateBooking from './pages/bookings/CreateBooking';
import Equipment from './pages/equipment/Equipment';
import Engineers from './pages/engineers/Engineers';
import Profile from './pages/profile/Profile';
import Calendar from './pages/calendar/Calendar';
import Settings from './pages/settings/Settings';
import NotFound from './pages/NotFound';

// Auth
import { PrivateRoute } from './components/auth/PrivateRoute';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/studios" element={<Studios />} />
                  <Route path="/studios/:id" element={<StudioDetail />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/bookings/create" element={<CreateBooking />} />
                  <Route path="/bookings/:id" element={<BookingDetail />} />
                  <Route path="/equipment" element={<Equipment />} />
                  <Route path="/engineers" element={<Engineers />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;