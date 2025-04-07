import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FiUser, FiLock, FiMail, FiUserPlus } from 'react-icons/fi';
import { COLORS } from '../styles/GlobalStyles';
import authService from '../services/authService';

const RegisterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 20px;
  background-color: ${COLORS.white};
`;

const RegisterCard = styled.div`
  background-color: ${COLORS.white};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  padding: 32px;
  
  @media (max-width: 480px) {
    padding: 24px;
  }
`;

const RegisterHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Title = styled.h2`
  color: ${COLORS.primary};
  font-size: 28px;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 16px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  position: relative;
`;

const FormInput = styled(Field)`
  padding: 12px 12px 12px 40px;
  border: 1px solid ${COLORS.darkGray};
  border-radius: 4px;
  width: 100%;
  font-size: 16px;
  transition: border-color 0.2s ease;
  
  &:focus {
    border-color: ${COLORS.secondary};
    outline: none;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 14px;
  color: ${COLORS.textSecondary};
`;

const ErrorText = styled.div`
  color: ${COLORS.error};
  font-size: 14px;
  margin-top: 6px;
`;

const RegisterButton = styled.button`
  background-color: ${COLORS.primary};
  color: ${COLORS.white};
  border: none;
  border-radius: 4px;
  padding: 12px;
  width: 100%;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${COLORS.secondary};
  }
  
  &:disabled {
    background-color: ${COLORS.darkGray};
    cursor: not-allowed;
  }
`;

const LoginLink = styled.div`
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: ${COLORS.textSecondary};
  
  a {
    color: ${COLORS.primary};
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Alert = styled.div`
  padding: 12px;
  border-radius: 4px;
  background-color: ${({ type }) => type === 'error' ? '#FEECEC' : '#E9F6EE'};
  color: ${({ type }) => type === 'error' ? COLORS.error : COLORS.success};
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const validationSchema = Yup.object().shape({
  username: Yup.string()
    .required('Имя пользователя обязательно')
    .min(3, 'Имя пользователя должно быть не менее 3 символов'),
  full_name: Yup.string()
    .required('Полное имя обязательно'),
  email: Yup.string()
    .email('Некорректный формат email')
    .required('Email обязателен'),
  password: Yup.string()
    .required('Пароль обязателен')
    .min(8, 'Пароль должен быть не менее 8 символов'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Пароли должны совпадать')
    .required('Подтверждение пароля обязательно')
});

const Register = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  
  const handleRegister = async (values, { setSubmitting }) => {
    try {
      await authService.register(values.username, values.email, values.password, values.full_name);
      setMessage({
        type: 'success',
        text: 'Регистрация выполнена успешно! Теперь вы можете войти в систему.'
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.detail || 'Ошибка регистрации. Пожалуйста, попробуйте снова.'
      });
      setSubmitting(false);
    }
  };
  
  return (
    <RegisterContainer>
      <RegisterCard>
        <RegisterHeader>
          <Title>Регистрация</Title>
          <Subtitle>Создайте учетную запись для доступа к системе</Subtitle>
        </RegisterHeader>
        
        {message && (
          <Alert type={message.type}>{message.text}</Alert>
        )}
        
        <Formik
          initialValues={{ username: '', email: '', password: '', confirmPassword: '', full_name: '' }}
          validationSchema={validationSchema}
          onSubmit={handleRegister}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form>
              <FormGroup>
                <InputIcon>
                  <FiUser />
                </InputIcon>
                <FormInput
                  type="text"
                  name="username"
                  placeholder="Имя пользователя"
                  className={errors.username && touched.username ? 'is-invalid' : ''}
                />
                <ErrorMessage name="username" component={ErrorText} />
              </FormGroup>
              
              <FormGroup>
                <InputIcon>
                  <FiUser />
                </InputIcon>
                <FormInput
                  type="text"
                  name="full_name"
                  placeholder="Полное имя"
                  className={errors.full_name && touched.full_name ? 'is-invalid' : ''}
                />
                <ErrorMessage name="full_name" component={ErrorText} />
              </FormGroup>
              
              <FormGroup>
                <InputIcon>
                  <FiMail />
                </InputIcon>
                <FormInput
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={errors.email && touched.email ? 'is-invalid' : ''}
                />
                <ErrorMessage name="email" component={ErrorText} />
              </FormGroup>
              
              <FormGroup>
                <InputIcon>
                  <FiLock />
                </InputIcon>
                <FormInput
                  type="password"
                  name="password"
                  placeholder="Пароль"
                  className={errors.password && touched.password ? 'is-invalid' : ''}
                />
                <ErrorMessage name="password" component={ErrorText} />
              </FormGroup>
              
              <FormGroup>
                <InputIcon>
                  <FiLock />
                </InputIcon>
                <FormInput
                  type="password"
                  name="confirmPassword"
                  placeholder="Подтвердите пароль"
                  className={errors.confirmPassword && touched.confirmPassword ? 'is-invalid' : ''}
                />
                <ErrorMessage name="confirmPassword" component={ErrorText} />
              </FormGroup>
              
              <RegisterButton type="submit" disabled={isSubmitting}>
                <FiUserPlus /> {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
              </RegisterButton>
            </Form>
          )}
        </Formik>
        
        <LoginLink>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </LoginLink>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register; 