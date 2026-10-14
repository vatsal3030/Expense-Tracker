'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Chip,
  Snackbar,
} from '@mui/material';
import {
  Close,
  ContentCopy,
  Download,
  OpenInNew,
  QrCode2,
  CheckCircle,
  Share,
} from '@mui/icons-material';

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  value: string;
  badgeText?: string;
  downloadFileName?: string;
}

export default function QrCodeModal({
  open,
  onClose,
  title,
  subtitle = 'Scan using any smartphone camera or UPI scanner to connect instantly',
  value,
  badgeText = 'Instant QR Code',
  downloadFileName = 'fairshare_qr.png',
}: QrCodeModalProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Crisp high-res QR Code endpoint
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    value
  )}&bgcolor=${isLight ? 'ffffff' : '141821'}&color=${isLight ? '0e6245' : '34d399'}&margin=12`;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setToastMessage('Link copied to clipboard! ✓');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = downloadFileName;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      setToastMessage('QR Code downloaded successfully!');
    } catch {
      window.open(qrCodeUrl, '_blank');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxWidth: 420,
            width: '100%',
            p: 1.5,
            textAlign: 'center',
            bgcolor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(20, 24, 33, 0.88)',
            backdropFilter: 'blur(24px) saturate(190%)',
            border: isLight ? '1px solid rgba(255, 255, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: isLight
              ? 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.7), 0 20px 40px -10px rgba(0, 0, 0, 0.08)'
              : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.12), 0 24px 50px -10px rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <DialogTitle sx={{ pt: 2, pb: 1, px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Chip
              icon={<QrCode2 fontSize="small" sx={{ color: '#0E6245 !important' }} />}
              label={badgeText}
              size="small"
              sx={{
                bgcolor: alpha('#0E6245', 0.1),
                color: '#0E6245',
                fontWeight: 750,
                fontSize: '0.72rem',
                borderRadius: 2,
              }}
            />
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem', mt: 0.5 }}>
            {subtitle}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 2, py: 2 }}>
          {/* macOS Glass Frame for QR Code */}
          <Box
            sx={{
              display: 'inline-block',
              p: 2,
              borderRadius: 3.5,
              bgcolor: isLight ? '#FFFFFF' : '#141821',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: isLight
                ? '0 8px 24px rgba(0, 0, 0, 0.06)'
                : '0 8px 30px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          >
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{
                width: 210,
                height: 210,
                display: 'block',
                borderRadius: 12,
              }}
            />
          </Box>

          {/* Copyable Link Preview Bar */}
          <Box
            sx={{
              mt: 2.5,
              p: 1.25,
              px: 1.75,
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.action.hover, 0.04),
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 240,
                textAlign: 'left',
              }}
            >
              {value}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton size="small" onClick={handleCopy} sx={{ color: '#0E6245' }}>
                {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleDownload}
            startIcon={<Download fontSize="small" />}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 650,
              fontSize: '0.8rem',
              borderColor: theme.palette.divider,
              color: 'text.primary',
              px: 2,
            }}
          >
            Download QR
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleCopy}
            startIcon={<Share fontSize="small" />}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              bgcolor: '#0E6245',
              color: '#FFFFFF',
              px: 2.5,
              '&:hover': { bgcolor: '#094A34' },
            }}
          >
            {copied ? 'Link Copied!' : 'Share Link'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage('')}
        message={toastMessage}
      />
    </>
  );
}
