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
  Chip,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close,
  ContentCopy,
  CheckCircle,
  QrCode2,
  OpenInNew,
  Smartphone,
  Shield,
} from '@mui/icons-material';

interface UpiPaymentModalProps {
  open: boolean;
  onClose: () => void;
  payeeName: string;
  payeeUpiId?: string;
  amount: number;
  currency?: string;
  onConfirmSettlement?: () => void;
}

export default function UpiPaymentModal({
  open,
  onClose,
  payeeName,
  payeeUpiId = 'fairshare.payee@okhdfcbank',
  amount,
  currency = 'INR',
  onConfirmSettlement,
}: UpiPaymentModalProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Standard UPI URI format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=FairShare
  const upiUri = `upi://pay?pa=${encodeURIComponent(payeeUpiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent('FairShare Settlement')}`;

  // Encoded URL for instant SVG QR code via lightweight SVG service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiUri
  )}&bgcolor=${isLight ? 'ffffff' : '121316'}&color=${isLight ? '0e6245' : '10b981'}&margin=10`;

  const handleCopy = () => {
    navigator.clipboard.writeText(payeeUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPaid = () => {
    setConfirmed(true);
    setTimeout(() => {
      if (onConfirmSettlement) onConfirmSettlement();
      onClose();
      setConfirmed(false);
    }, 1200);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            color: 'text.primary',
            backgroundImage: 'none',
            boxShadow: isLight ? '0 8px 30px rgba(0,0,0,0.08)' : '0 8px 30px rgba(0,0,0,0.5)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: 2,
              bgcolor: alpha('#0E6245', 0.1),
              color: '#0E6245',
              display: 'flex',
            }}
          >
            <QrCode2 />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              Instant UPI Settlement
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Zero transaction fees
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
        {/* Payee & Amount Highlight */}
        <Typography variant="body2" color="text.secondary">
          Paying <strong>{payeeName}</strong>
        </Typography>
        <Typography variant="h3" fontWeight={800} sx={{ color: '#0E6245', my: 1, letterSpacing: '-0.02em' }}>
          ₹{amount.toFixed(0)}
        </Typography>

        {/* QR Code Container */}
        <Box
          sx={{
            display: 'inline-block',
            p: 2,
            bgcolor: isLight ? '#FFFFFF' : '#121316',
            borderRadius: 3.5,
            border: `1px solid ${theme.palette.divider}`,
            position: 'relative',
            my: 2,
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt="UPI QR Code"
            width={180}
            height={180}
            style={{ borderRadius: 10, display: 'block' }}
          />
          <Chip
            icon={<Shield sx={{ '&&': { color: '#0E6245', fontSize: 14 } }} />}
            label="Verified UPI"
            size="small"
            sx={{
              position: 'absolute',
              bottom: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              color: '#0E6245',
              fontSize: '0.65rem',
              fontWeight: 700,
            }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
          Scan using any UPI app (GPay, PhonePe, Paytm)
        </Typography>

        {/* UPI ID Copy bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: isLight ? '#F4F5F7' : 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2.5,
            px: 2,
            py: 1,
            mt: 2,
          }}
        >
          <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.675rem' }}>
              UPI ID (VPA)
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                fontSize: '0.825rem',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {payeeUpiId}
            </Typography>
          </Box>
          <Tooltip title={copied ? 'Copied!' : 'Copy UPI ID'}>
            <IconButton onClick={handleCopy} size="small" sx={{ color: copied ? '#0E6245' : 'text.secondary' }}>
              {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Mobile App Intent button */}
        <Button
          fullWidth
          variant="outlined"
          href={upiUri}
          startIcon={<Smartphone />}
          endIcon={<OpenInNew fontSize="small" />}
          sx={{
            mt: 2,
            borderRadius: 2.5,
            borderColor: theme.palette.divider,
            color: 'text.primary',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#0E6245',
              bgcolor: alpha('#0E6245', 0.04),
            },
          }}
        >
          Pay on Mobile App
        </Button>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${theme.palette.divider}`, flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleMarkPaid}
          disabled={confirmed}
          sx={{
            py: 1.25,
            borderRadius: 2.5,
            fontWeight: 600,
            textTransform: 'none',
            bgcolor: '#0E6245',
            color: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(14, 98, 69, 0.25)',
            '&:hover': {
              bgcolor: '#094A34',
            },
          }}
        >
          {confirmed ? 'Marked as Paid! ✓' : 'I Have Completed the Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
