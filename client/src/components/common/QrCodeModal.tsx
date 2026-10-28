'use client';

import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  ContentCopy,
  Download,
  CheckCircle,
  Share,
  WhatsApp,
} from '@mui/icons-material';
import QRCode from 'qrcode';

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
  subtitle = 'Scan using any camera or FairShare app to connect instantly',
  value,
  badgeText = 'Instant QR Code',
  downloadFileName = 'fairshare_qr.png',
}: QrCodeModalProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [generating, setGenerating] = useState(true);

  // Generate high-resolution, client-side QR Code with zero network latency
  useEffect(() => {
    if (!open || !value) return;

    let isMounted = true;
    setGenerating(true);

    QRCode.toDataURL(value, {
      width: 480,
      margin: 2,
      color: {
        dark: isLight ? '#0F172A' : '#34D399',
        light: isLight ? '#FFFFFF' : '#141821',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate local QR code:', err);
        if (isMounted) setGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, value, isLight]);

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setToastMessage('Link copied to clipboard! ✓');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Connect on FairShare',
          text: `Connect with me on FairShare: ${value}`,
          url: value,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Hey! Connect with me on FairShare so we can easily split bills and track shared expenses: ${value}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    try {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = downloadFileName.endsWith('.png') ? downloadFileName : `${downloadFileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setToastMessage('QR Code downloaded successfully!');
    } catch (err) {
      console.error('Download failed:', err);
      setToastMessage('Failed to download QR image.');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.72)',
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important',
            },
          },
          paper: {
            sx: {
              borderRadius: { xs: 3, sm: 4 },
              maxWidth: { xs: 'calc(100% - 24px)', sm: 420 },
              width: { xs: 'calc(100% - 24px)', sm: '100%' },
              m: { xs: 1.5, sm: 3 },
              p: { xs: 1, sm: 1.5 },
              textAlign: 'center',
              bgcolor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(20, 24, 33, 0.94)',
              backdropFilter: 'blur(24px) saturate(190%)',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: isLight
                ? '0 20px 40px -10px rgba(0, 0, 0, 0.08)'
                : '0 24px 50px -10px rgba(0, 0, 0, 0.6)',
            },
          },
        }}
      >
        <Box sx={{ position: 'relative', pt: 1.5, px: 2, pb: 0 }}>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.06) },
            }}
          >
            <Close fontSize="small" />
          </IconButton>

          <Chip
            label={badgeText}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.02em',
              mb: 1.5,
              bgcolor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(52, 211, 153, 0.15)',
              color: isLight ? '#065F46' : '#34D399',
              border: `1px solid ${isLight ? 'rgba(16, 185, 129, 0.25)' : 'rgba(52, 211, 153, 0.3)'}`,
            }}
          />
        </Box>

        <DialogTitle component="div" sx={{ p: 0, px: 2.5, pb: 1 }}>
          <Typography component="div" variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.15rem', sm: '1.3rem' } }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem', mt: 0.5 }}>
            {subtitle}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 2, py: 2 }}>
          {/* macOS Glass Frame for Client-Side QR Code */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              borderRadius: 3.5,
              bgcolor: isLight ? '#FFFFFF' : '#141821',
              border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: isLight
                ? '0 8px 24px rgba(0, 0, 0, 0.06)'
                : '0 8px 30px rgba(0, 0, 0, 0.4)',
              minWidth: 220,
              minHeight: 220,
            }}
          >
            {generating ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 4 }}>
                <CircularProgress size={32} sx={{ color: '#34D399' }} />
                <Typography variant="caption" color="text.secondary">Generating QR Code...</Typography>
              </Box>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="FairShare QR Code"
                style={{
                  width: 210,
                  height: 210,
                  display: 'block',
                  borderRadius: 12,
                }}
              />
            ) : (
              <Typography variant="caption" color="error">Failed to generate QR code.</Typography>
            )}
          </Box>

          {/* Copyable Link Preview Bar */}
          <Box
            sx={{
              mt: 2.5,
              p: 1.25,
              px: 1.75,
              borderRadius: 2.5,
              bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
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
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{
                  color: copied ? '#10B981' : 'text.secondary',
                  bgcolor: copied ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                }}
              >
                {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            pb: 2,
            pt: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              className="glass-emerald-active"
              startIcon={<Share />}
              onClick={handleNativeShare}
              sx={{
                borderRadius: 2.5,
                fontWeight: 700,
                color: '#FFFFFF',
                py: 1,
                fontSize: '0.85rem',
                textTransform: 'none',
              }}
            >
              Share Link
            </Button>
            <Button
              variant="outlined"
              onClick={handleWhatsAppShare}
              sx={{
                borderRadius: 2.5,
                color: '#25D366',
                borderColor: 'rgba(37, 211, 102, 0.3)',
                '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.1)', borderColor: '#25D366' },
                px: 2,
              }}
            >
              <WhatsApp fontSize="small" />
            </Button>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            className="glass-tertiary"
            startIcon={<Download />}
            onClick={handleDownload}
            disabled={!qrDataUrl}
            sx={{
              borderRadius: 2.5,
              fontWeight: 650,
              py: 0.85,
              fontSize: '0.825rem',
              textTransform: 'none',
              color: 'text.primary',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            Download QR Code Image
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 600 }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
