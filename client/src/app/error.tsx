'use client';

import { useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 3,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box sx={{ color: 'error.main', opacity: 0.8, display: 'flex' }}>
        <AlertCircle size={56} />
      </Box>
      <Typography variant="h5" fontWeight={600}>
        Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
        An unexpected error occurred. Please try again or refresh the page.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <Button variant="contained" onClick={reset} size="large">
          Try Again
        </Button>
        <Button
          variant="outlined"
          onClick={() => (window.location.href = '/dashboard')}
          size="large"
        >
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
}
