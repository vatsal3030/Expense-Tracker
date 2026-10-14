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
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Standard UPI URI format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=FairShare
  const upiUri = `upi://pay?pa=${encodeURIComponent(payeeUpiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent('FairShare Settlement')}`;

  // Encoded URL for instant SVG QR code via lightweight SVG service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiUri
  )}&bgcolor=0f172a&color=10b981&margin=10`;

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
            bgcolor: '#0f172a',
            border: '1px solid #1e293b',
            color: '#f8fafc',
            backgroundImage: 'none',
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
          borderBottom: '1px solid #1e293b',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              w: 32,
              h: 32,
              p: 0.75,
              borderRadius: 2,
              bgcolor: 'rgba(16,185,129,0.12)',
              color: '#10b981',
              display: 'flex',
            }}
          >
            <QrCode2 fontSize="small" />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Instant UPI Settle
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Paying {payeeName}
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#f8fafc', my: 1 }}>
          ₹{amount.toLocaleString('en-IN')}
        </Typography>

        {/* QR Code container */}
        <Box
          sx={{
            display: 'inline-block',
            p: 2,
            bgcolor: '#090d16',
            borderRadius: 3,
            border: '1px solid #1e293b',
            my: 2,
            position: 'relative',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt="UPI QR Code"
            width={180}
            height={180}
            style={{ borderRadius: 8, display: 'block' }}
          />
          <Chip
            icon={<Shield sx={{ '&&': { color: '#10b981', fontSize: 14 } }} />}
            label="Verified UPI"
            size="small"
            sx={{
              position: 'absolute',
              bottom: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: '#0f172a',
              border: '1px solid #1e293b',
              color: '#34d399',
              fontSize: '0.65rem',
              fontWeight: 700,
            }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
          Scan using any UPI app (GPay, PhonePe, Paytm)
        </Typography>

        {/* UPI ID Copy bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: 2.5,
            px: 2,
            py: 1,
            mt: 2,
          }}
        >
          <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              UPI ID (VPA)
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#f8fafc',
                fontWeight: 600,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {payeeUpiId}
            </Typography>
          </Box>
          <Tooltip title={copied ? 'Copied!' : 'Copy UPI ID'}>
            <IconButton onClick={handleCopy} size="small" sx={{ color: copied ? '#10b981' : '#94a3b8' }}>
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
            borderColor: '#334155',
            color: '#f8fafc',
            fontWeight: 600,
            '&:hover': {
              borderColor: '#10b981',
              bgcolor: 'rgba(16,185,129,0.06)',
            },
          }}
        >
          Pay on Mobile App
        </Button>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid #1e293b', flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleMarkPaid}
          disabled={confirmed}
          sx={{
            py: 1.25,
            borderRadius: 2.5,
            fontWeight: 600,
            bgcolor: '#059669',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
            '&:hover': {
              bgcolor: '#047857',
            },
          }}
        >
          {confirmed ? 'Marked as Paid! ✓' : 'I Have Completed the Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
