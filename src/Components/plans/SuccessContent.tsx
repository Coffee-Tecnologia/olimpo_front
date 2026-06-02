'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const REDIRECT_SECONDS = 5;

interface SuccessContentProps {
  sessionId: string | null;
}

export const SuccessContent: React.FC<SuccessContentProps> = ({ sessionId }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return_url') ?? '/';
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/plans');
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = returnUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, returnUrl]);

  if (!sessionId) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
        gap: 3,
      }}
    >
      <CheckCircleOutlineIcon
        sx={{
          fontSize: 96,
          color: 'success.main',
          animation: 'pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          '@keyframes pop': {
            '0%': { transform: 'scale(0)', opacity: 0 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
        }}
      />

      <Box>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Assinatura confirmada!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
          Seu plano está sendo ativado. Isso pode levar alguns instantes.
          Você será redirecionado automaticamente em{' '}
          <Typography component="span" fontWeight={700} color="primary.main">
            {countdown}s
          </Typography>
          .
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <CircularProgress size={16} thickness={5} />
        <Typography variant="caption" color="text.secondary">
          Ativando sua conta…
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={() => { window.location.href = returnUrl; }}
        sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 600 }}
      >
        Ir para o painel agora
      </Button>
    </Box>
  );
};
