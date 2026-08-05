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
          /* ── Design tokens — plans page ── */
          '--navy': '#1B2145',
          '--navy-soft': '#2E3868',
          '--navy-tint': '#F2F3FA',
          '--orange': '#F2793A',
          '--orange-dark': '#D9612A',
          '--page-bg': '#F7F8FA',
          '--card-bg': '#FFFFFF',
          '--border': '#E5E7EF',
          '--text-primary': '#1B2145',
          '--text-secondary': '#6B7280',
          '--text-muted': '#9CA3AF',
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
