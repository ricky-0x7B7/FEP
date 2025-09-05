


import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';
import { checkStoredUser, logout, setInitialized } from './store/slices/authSlice';

export default function App() {
  const dispatch = useDispatch();
  const { user, userRole } = useSelector((state) => state.auth);

  const handleLogout = () => {
    localStorage.removeItem('user');
    dispatch(logout());
  };

  // Check for stored user data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        dispatch(checkStoredUser(userData));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        dispatch(setInitialized());
      }
    } else {
      dispatch(setInitialized());
    }
  }, [dispatch]);

  return (
    <Router>
      <Navbar userRole={userRole} onLogout={handleLogout} user={user} />
      <div className="flex min-h-screen bg-gray-50 pt-16">
        <div className="flex-1">
          <AppRoutes />
        </div>
      </div>
    </Router>
  );
} 
