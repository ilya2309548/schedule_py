import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import authService from '../services/authService';

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #555;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 4px;
  text-align: center;
  
  ${props => props.success && `
    background-color: #d4edda;
    color: #155724;
  `}
  
  ${props => props.error && `
    background-color: #f8d7da;
    color: #721c24;
  `}
`;

const Profile = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const profile = await authService.getUserProfile();
      console.log('Profile data received:', profile);
      setUserData({
        username: profile.username || '',
        email: profile.email || '',
        fullName: profile.full_name || '',
        phone: profile.phone || '',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Ошибка при загрузке данных пользователя' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Create update data in exact format that the backend expects
      const updatedData = {
        username: userData.username,
        email: userData.email,
        full_name: userData.fullName,
        // Don't include fields that might not be supported by the backend schema
      };
      
      console.log('Sending profile update:', updatedData);
      const result = await authService.updateUserProfile(updatedData);
      console.log('Profile update response:', result);
      
      // Refresh user data from the server to ensure we display what was actually saved
      await fetchUserData();
      
      setMessage({ type: 'success', text: 'Профиль успешно обновлен' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.detail || 'Ошибка при обновлении профиля'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProfileContainer>
        <Title>Загрузка...</Title>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <Title>Профиль пользователя</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Имя пользователя</Label>
          <Input
            type="text"
            name="username"
            value={userData.username}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Email</Label>
          <Input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Полное имя</Label>
          <Input
            type="text"
            name="fullName"
            value={userData.fullName}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Телефон</Label>
          <Input
            type="tel"
            name="phone"
            value={userData.phone || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
        </FormGroup>

        {!isEditing ? (
          <Button type="button" onClick={() => setIsEditing(true)}>
            Редактировать профиль
          </Button>
        ) : (
          <>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
            <Button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              style={{ marginTop: '1rem', backgroundColor: '#6c757d' }}
              disabled={isLoading}
            >
              Отменить
            </Button>
          </>
        )}
      </Form>
      
      {message.text && (
        <Message success={message.type === 'success'} error={message.type === 'error'}>
          {message.text}
        </Message>
      )}
    </ProfileContainer>
  );
};

export default Profile; 