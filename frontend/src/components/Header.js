import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FiMenu, FiX, FiUser, FiLogOut, FiCalendar, FiBook, FiCheckSquare, FiClipboard } from 'react-icons/fi';
import { COLORS } from '../styles/GlobalStyles';
import authService from '../services/authService';

const HeaderContainer = styled.header`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  padding: 16px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const Logo = styled(Link)`
  font-size: 24px;
  font-weight: 700;
  color: ${COLORS.white};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 250px;
    flex-direction: column;
    background-color: ${COLORS.primary};
    padding: 80px 20px 20px;
    z-index: 9;
    transition: transform 0.3s ease;
    transform: ${({ isOpen }) => (isOpen ? 'translateX(0)' : 'translateX(100%)')};
  }
`;

const NavItem = styled(Link)`
  color: ${COLORS.white};
  margin-left: 24px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 0;
    width: 0;
    height: 2px;
    background-color: ${COLORS.white};
    transition: width 0.3s ease;
  }
  
  &:hover:after, &.active:after {
    width: 100%;
  }
  
  @media (max-width: 768px) {
    margin: 8px 0;
    width: 100%;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 24px;
  cursor: pointer;
  position: relative;
  
  @media (max-width: 768px) {
    margin: 16px 0;
    width: 100%;
    justify-content: flex-start;
  }
`;

const UserDropdown = styled.div`
  position: absolute;
  top: 40px;
  right: 0;
  background-color: ${COLORS.white};
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 8px 0;
  width: 160px;
  z-index: 10;
  
  @media (max-width: 768px) {
    position: static;
    box-shadow: none;
    width: 100%;
    margin-top: 8px;
    background-color: transparent;
    padding: 0;
  }
`;

const DropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: ${COLORS.text};
  text-decoration: none;
  
  &:hover {
    background-color: ${COLORS.accent};
  }
  
  @media (max-width: 768px) {
    color: ${COLORS.white};
    padding: 8px 0;
    
    &:hover {
      background-color: transparent;
    }
  }
`;

const MenuButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: ${COLORS.white};
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Overlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 8;
  }
`;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    
    if (user) {
      // Fetch user profile
      fetchUserProfile();
    }
    
    // Set up a listener for profile changes
    const handleStorageChange = () => {
      const updatedUser = authService.getCurrentUser();
      setCurrentUser(updatedUser);
      if (updatedUser) {
        fetchUserProfile();
      }
    };
    
    // Listen for storage events (in case profile is updated in another tab)
    window.addEventListener('storage', handleStorageChange);
    
    // Check for profile updates every 30 seconds
    const intervalId = setInterval(fetchUserProfile, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      const profile = await authService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      
      // Если ошибка связана с аутентификацией (401), перенаправляем на страницу входа
      if (error.status === 401 || (error.detail && error.detail.includes('authentication'))) {
        console.log('Authentication error, redirecting to login page');
        authService.logout();
        setCurrentUser(null);
        setUserProfile(null);
        navigate('/login');
      }
    }
  };
  
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setUserProfile(null);
    navigate('/login');
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };
  
  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          <FiCalendar /> University App
        </Logo>
        
        {currentUser && (
          <>
            <MenuButton onClick={toggleMenu}>
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </MenuButton>
            
            <Overlay isOpen={isMenuOpen} onClick={closeMenu} />
            
            <Nav isOpen={isMenuOpen}>
              <NavItem 
                to="/schedule" 
                className={location.pathname === '/schedule' ? 'active' : ''}
                onClick={closeMenu}
              >
                <FiCalendar /> Расписание
              </NavItem>
              <NavItem 
                to="/assignments" 
                className={location.pathname === '/assignments' ? 'active' : ''}
                onClick={closeMenu}
              >
                <FiBook /> Задания
              </NavItem>
              <NavItem 
                to="/attendance" 
                className={location.pathname === '/attendance' ? 'active' : ''}
                onClick={closeMenu}
              >
                <FiCheckSquare /> Посещаемость
              </NavItem>
              
              <UserInfo onClick={toggleDropdown}>
                <FiUser />
                {userProfile ? userProfile.full_name : currentUser.username}
                {isDropdownOpen && (
                  <UserDropdown>
                    <DropdownItem to="/profile" onClick={closeMenu}>
                      <FiUser /> Профиль
                    </DropdownItem>
                    <DropdownItem as="div" onClick={handleLogout}>
                      <FiLogOut /> Выйти
                    </DropdownItem>
                  </UserDropdown>
                )}
              </UserInfo>
            </Nav>
          </>
        )}
        
        {!currentUser && (
          <Nav>
            <NavItem 
              to="/login" 
              className={location.pathname === '/login' ? 'active' : ''}
            >
              Войти
            </NavItem>
            <NavItem 
              to="/register" 
              className={location.pathname === '/register' ? 'active' : ''}
            >
              Регистрация
            </NavItem>
          </Nav>
        )}
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header; 