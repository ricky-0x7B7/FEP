import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Home from '../pages/Home';
import Missions from '../pages/Missions';
import MissionDetail from '../pages/MissionDetail';
import News from '../pages/News';
import NewsDetail from '../pages/NewsDetail';
import Children from '../pages/Children';
import ChildDetail from '../pages/ChildDetail';
import EnhancedChildren from '../pages/EnhancedChildren';
import FilterDemo from '../pages/FilterDemo';
import Users from '../pages/Users';
import NotFound from '../pages/NotFound';
import Login from '../pages/Login';

// Protected Route wrapper
const ProtectedRoute = ({ children, user, isInitialized, requiredRole = null }) => {
  // Mostra loading se l'autenticazione non è ancora inizializzata
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function AppRoutes() {
  const { user, isInitialized } = useSelector((state) => state.auth);
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/login' element={<Login />} />
      
      {/* Missions Routes */}
      <Route path='/missions' element={
        <ProtectedRoute user={user} isInitialized={isInitialized}>
          <Missions user={user} />
        </ProtectedRoute>
      } />
      <Route path='/missions/:id' element={
        <ProtectedRoute user={user} isInitialized={isInitialized}>
          <MissionDetail />
        </ProtectedRoute>
      } />
      
      {/* News Routes */}
      <Route path='/news' element={
        <ProtectedRoute user={user} isInitialized={isInitialized}>
          <News />
        </ProtectedRoute>
      } />
      <Route path='/news/:id' element={
        <ProtectedRoute user={user} isInitialized={isInitialized}>
          <NewsDetail />
        </ProtectedRoute>
      } />
      
      {/* Children Routes */}
      <Route path='/children' element={
        <ProtectedRoute user={user} isInitialized={isInitialized}>
          <Children user={user} />
        </ProtectedRoute>
      } />
      <Route path='/children/:id' element={
        <ProtectedRoute user={user} isInitialized={isInitialized}>
          <ChildDetail />
        </ProtectedRoute>
      } />
      
      {/* Enhanced Children Route - Advanced filtering demo */}
      <Route path='/enhanced-children' element={
        <ProtectedRoute user={user} isInitialized={isInitialized}>
          <EnhancedChildren user={user} />
        </ProtectedRoute>
      } />
      
      {/* Filter Demo Route - Comprehensive filtering showcase */}
      <Route path='/filter-demo' element={
        <ProtectedRoute user={user} isInitialized={isInitialized}>
          <FilterDemo user={user} />
        </ProtectedRoute>
      } />
      
      {/* Users Routes */}
      <Route path='/users' element={
        <ProtectedRoute user={user} isInitialized={isInitialized} requiredRole="admin">
          <Users user={user} />
        </ProtectedRoute>
      } />
      
      <Route path='*' element={<NotFound />} />
    </Routes>
  );
}

