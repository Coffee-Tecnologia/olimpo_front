import type { Metadata } from 'next';
import { Inter, Nunito, Poppins } from 'next/font/google';

import { ThemeProvider } from '@/style/theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

const nunito = Nunito({
  weight: ['300', '400', '500', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
});

// Carregadas como variáveis CSS para uso pontual (ex: plans page).
// Não substituem a font-family global que vem do Nunito acima.
const poppins = Poppins({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Olimpo',
  description: 'Licenciamento e pagamentos SaaS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.className} ${poppins.variable} ${inter.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
