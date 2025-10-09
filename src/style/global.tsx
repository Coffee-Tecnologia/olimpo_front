import { GlobalStyles } from '@mui/styled-engine-sc';

export const AppGlobalStyle = () => {
  return (
    <GlobalStyles
      styles={{
        ':root': {
          '--white': '#FFF',
          '--red-500': '#d32f2f;',
          '--white-300': '#dfe7ef',
          '--body-bg-color': '#ececec',
          '--silver-300': '#ececec',
          '--green-300': '#c5e1a557',
          '--green-400': '#c5e1a599',
          '--green-800': '#1B5E20',
        },
        body: {
          margin: '0',
          padding: '0',
          backgroundColor: 'var(--body-bg-color)',
        },
      }}
    />
  );
};
