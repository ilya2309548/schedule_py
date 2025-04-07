import axios from 'axios';

const API_URL = '/api';

// Helper to get form data for token request
const createFormData = (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  return formData;
};

export const authService = {
  // Register a new user
  register: async (username, email, password, full_name) => {
    try {
      const userData = {
        username,
        email,
        password,
        full_name: full_name || username, // Используем переданное полное имя или username как запасной вариант
        role: "student" // По умолчанию регистрируем пользователя как студента
      };
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to register' };
    }
  },

  // Login and get token
  login: async (username, password) => {
    try {
      const formData = createFormData(username, password);
      const response = await axios.post(`${API_URL}/auth/token`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.access_token) {
        // Сохраняем токен и информацию о пользователе
        localStorage.setItem('user', JSON.stringify(response.data));
        
        // Дополнительно получаем полную информацию о пользователе
        try {
          const userProfile = await authService.getUserProfile();
          // Обновляем сохраненную информацию, добавляя данные из профиля
          const updatedUserData = {
            ...response.data,
            ...userProfile,
          };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Если не удалось получить профиль, продолжаем с имеющимися данными
        }
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to login' };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return null;
      
      const user = JSON.parse(userString);
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Очищаем некорректные данные
      localStorage.removeItem('user');
      return null;
    }
  },

  // Get user profile
  getUserProfile: async () => {
    try {
      const user = authService.getCurrentUser();
      
      if (!user || !user.access_token) {
        throw { status: 401, detail: 'User not authenticated' };
      }
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });
      
      return response.data;
    } catch (error) {
      // Проверяем, является ли ошибка ответом от сервера
      if (error.response) {
        // Если ошибка 401 (Unauthorized), это может быть связано с истечением токена
        if (error.response.status === 401) {
          return { status: 401, detail: 'Authentication token expired or invalid' };
        }
        // Возвращаем данные ошибки от сервера
        return error.response.data;
      }
      // Если ошибка не связана с ответом сервера, возвращаем общее сообщение
      return { status: 500, detail: 'Failed to get user profile' };
    }
  },

  // Update user profile
  updateUserProfile: async (userData) => {
    try {
      const user = authService.getCurrentUser();
      
      if (!user || !user.access_token) {
        throw new Error('User not authenticated');
      }
      
      console.log('Making API call to update profile with data:', userData);
      
      const response = await axios.put(`${API_URL}/auth/me`, userData, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API response for profile update:', response.data);
      
      // Update the stored user information with the new profile data
      if (response.data) {
        const updatedUserData = {
          ...user,
          ...response.data,
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error.response?.data || { detail: 'Failed to update user profile' };
    }
  }
};

// Axios interceptor for adding auth token to requests
axios.interceptors.request.use(
  (config) => {
    const user = authService.getCurrentUser();
    if (user && user.access_token) {
      config.headers.Authorization = `Bearer ${user.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios interceptor for handling 401 responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Проверяем, связан ли запрос с посещаемостью
    const isAttendanceRequest = error.config && error.config.url && 
      (error.config.url.includes('/attendance') || error.config.url.includes('/auth/me'));
    
    if (error.response && error.response.status === 401) {
      // Получаем текущий путь страницы
      const currentPath = window.location.pathname;
      
      // Проверяем, не находимся ли мы на странице посещаемости
      const isAttendancePage = currentPath.includes('/attendance');
      
      // Проверяем, есть ли токен в localStorage
      const user = authService.getCurrentUser();
      const hasToken = user && user.access_token;
      
      // Если это страница посещаемости и у нас есть токен,
      // не выполняем перенаправление на логин
      if ((isAttendancePage || isAttendanceRequest) && hasToken) {
        console.warn('Authenticated API call failed on attendance page. Token may be invalid, but not redirecting.');
        // Возвращаем ошибку без перенаправления
        return Promise.reject(error);
      }
      
      // В остальных случаях выполняем стандартное поведение - логаут и редирект
      authService.logout();
      
      // Сохраняем текущий URL для перенаправления после логина
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = `/login?redirectUrl=${encodeURIComponent(currentPath)}`;
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default authService; 