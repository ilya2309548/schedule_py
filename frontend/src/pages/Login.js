import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';
import { COLORS } from '../styles/GlobalStyles';
import authService from '../services/authService';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 20px;
  background-color: ${COLORS.white};
`;

const LoginCard = styled.div`
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

const LoginHeader = styled.div`
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

const LoginButton = styled.button`
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

const RegisterLink = styled.div`
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
    .required('Имя пользователя обязательно'),
  password: Yup.string()
    .required('Пароль обязателен')
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState(null);
  const [redirectPath, setRedirectPath] = useState('/');
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get('redirectUrl');
    if (redirect) {
      setRedirectPath(redirect);
    }
  }, [location]);
  
  const handleLogin = async (values, { setSubmitting }) => {
    try {
      await authService.login(values.username, values.password);
      navigate(redirectPath);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.detail || 'Ошибка входа. Проверьте имя пользователя и пароль.'
      });
      setSubmitting(false);
    }
  };
  
  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <Title>Вход в систему</Title>
          <Subtitle>Введите свои учетные данные для продолжения</Subtitle>
        </LoginHeader>
        
        {message && (
          <Alert type={message.type}>{message.text}</Alert>
        )}
        
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleLogin}
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
              
              <LoginButton type="submit" disabled={isSubmitting}>
                <FiLogIn /> {isSubmitting ? 'Вход...' : 'Войти'}
              </LoginButton>
            </Form>
          )}
        </Formik>
        
        <RegisterLink>
          Еще нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </RegisterLink>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login; 