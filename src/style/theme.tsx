'use client';
import { ThemeProvider as DefaultThemeProvider, createTheme } from '@mui/material/styles';

import { AppGlobalStyle } from './global';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = createTheme({
    palette: {
      primary: {
        main: '#5e60ce',
      },
      secondary: {
        main: '#ff4081',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  return (
    <DefaultThemeProvider theme={theme}>
      <AppGlobalStyle />
      {children}
    </DefaultThemeProvider>
  );
};
