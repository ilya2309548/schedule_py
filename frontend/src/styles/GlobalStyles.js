import { createGlobalStyle } from 'styled-components';

// Color palette
export const COLORS = {
  primary: '#1a73e8',     // Deep blue
  secondary: '#4285f4',   // Medium blue
  light: '#8ab4f8',       // Light blue
  accent: '#e8f0fe',      // Very light blue
  white: '#ffffff',
  gray: '#f8f9fa',
  darkGray: '#dadce0',
  text: '#202124',
  textSecondary: '#5f6368',
  success: '#34a853',
  error: '#ea4335',
  warning: '#fbbc04'
};

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Roboto', sans-serif;
  }

  body {
    background-color: ${COLORS.white};
    color: ${COLORS.text};
    line-height: 1.5;
  }

  a {
    color: ${COLORS.secondary};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${COLORS.primary};
    }
  }

  button {
    cursor: pointer;
    background-color: ${COLORS.primary};
    color: ${COLORS.white};
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: ${COLORS.secondary};
    }

    &:disabled {
      background-color: ${COLORS.darkGray};
      cursor: not-allowed;
    }
  }

  input, select, textarea {
    padding: 10px;
    border: 1px solid ${COLORS.darkGray};
    border-radius: 4px;
    font-size: 14px;
    width: 100%;
    transition: border 0.2s ease;

    &:focus {
      outline: none;
      border-color: ${COLORS.secondary};
    }
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${COLORS.primary};
    margin-bottom: 16px;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .error-message {
    color: ${COLORS.error};
    font-size: 14px;
    margin-top: 4px;
  }

  .success-message {
    color: ${COLORS.success};
    font-size: 14px;
    margin-top: 4px;
  }
`;

export default GlobalStyles; 