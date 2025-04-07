import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import GlobalStyles from './styles/GlobalStyles';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Schedule from './pages/Schedule';
import Assignments from './pages/Assignments';
import Attendance from './pages/Attendance';
import Profile from './pages/Profile';
import authService from './services/authService';

// Private route component
const PrivateRoute = ({ children }) => {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    // Сохраняем текущий путь для перенаправления после успешного входа
    const currentPath = window.location.pathname;
    return <Navigate to={`/login?redirectUrl=${encodeURIComponent(currentPath)}`} />;
  }
  return children;
};

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
`;

const Footer = styled.footer`
  padding: 16px;
  background-color: #f8f9fa;
  text-align: center;
  font-size: 14px;
  color: #6c757d;
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <GlobalStyles />
        <Header />
        <MainContent>
          <Routes>
            <Route path="/" element={<Navigate to="/schedule" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/schedule" element={<PrivateRoute><Schedule /></PrivateRoute>} />
            <Route path="/assignments" element={<PrivateRoute><Assignments /></PrivateRoute>} />
            <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </MainContent>
        <Footer>
          © {new Date().getFullYear()} Университетское приложение
        </Footer>
      </AppContainer>
    </Router>
  );
}

export default App; 