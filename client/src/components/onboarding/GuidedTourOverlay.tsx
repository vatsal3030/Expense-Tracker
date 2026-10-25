'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  ArrowForward,
  ArrowBack,
  PlayArrow,
  Pause,
  FlashOn,
  AccountBalanceWalletOutlined,
  Handshake,
  GroupsOutlined,
  EmojiEvents,
  SportsEsportsOutlined,
  CheckCircle,
} from '@mui/icons-material';
import { useOnboarding, TOUR_STEPS } from '@/providers/OnboardingProvider';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export default function GuidedTourOverlay() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    isTourActive,
    tourStepIndex,
    currentTourStep,
    totalTourSteps,
    isAutoPlay,
    autoPlayProgress,
    showWelcomePill,
    startTour,
    pauseTour,
    resumeTour,
    toggleAutoPlay,
    nextTourStep,
    prevTourStep,
    jumpToStep,
    endTour,
    dismissWelcomePill,
  } = useOnboarding();

  const [rect, setRect] = useState<TargetRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // When user hovers on HUD, gently pause auto-play so they can read or test comfortably
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isAutoPlay) pauseTour();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    resumeTour();
  };

  // Measure and align spotlight around the real web UI target element
  const updateTargetPosition = useCallback(() => {
    if (!isTourActive || !currentTourStep) {
      setRect(null);
      return;
    }

    let targetEl = document.querySelector(currentTourStep.targetSelector) as HTMLElement | null;

    // Mobile fallback if element is hidden or different on mobile view
    if (isMobile) {
      if (currentTourStep.id === 'sidebar-nav') {
        targetEl = (document.querySelector('[data-tour="mobile-nav"]') as HTMLElement | null) || targetEl;
      } else if (currentTourStep.id === 'fairscore-badge') {
        // On mobile, fairscore-badge is hidden in toolbar; treat as screen overview
        targetEl = null;
      }
    }

    // Check if element exists, is rendered in the DOM, and has non-zero size
    if (!targetEl || targetEl.offsetParent === null) {
      setRect(null);
      return;
    }

    const clientRect = targetEl.getBoundingClientRect();
    if (clientRect.width === 0 || clientRect.height === 0) {
      setRect(null);
      return;
    }

    const targetMeasurements: TargetRect = {
      top: clientRect.top,
      left: clientRect.left,
      width: clientRect.width,
      height: clientRect.height,
      bottom: clientRect.bottom,
      right: clientRect.right,
    };

    setRect(targetMeasurements);

    // Calculate collision-aware tooltip coordinates
    if (tooltipRef.current) {
      const tooltipBox = tooltipRef.current.getBoundingClientRect();
      const tooltipW = tooltipBox.width || 420;
      const tooltipH = tooltipBox.height || 260;
      const margin = 16;
      const placement = currentTourStep.preferredPlacement || 'bottom';

      let calcTop = 0;
      let calcLeft = 0;

      if (placement === 'bottom') {
        calcTop = clientRect.bottom + margin;
        calcLeft = clientRect.left + clientRect.width / 2 - tooltipW / 2;

        // Flip to top if overflowing screen bottom
        if (calcTop + tooltipH > window.innerHeight - 20) {
          calcTop = Math.max(20, clientRect.top - tooltipH - margin);
        }
      } else if (placement === 'top') {
        calcTop = clientRect.top - tooltipH - margin;
        calcLeft = clientRect.left + clientRect.width / 2 - tooltipW / 2;

        if (calcTop < 20) {
          calcTop = clientRect.bottom + margin;
        }
      } else if (placement === 'right') {
        calcLeft = clientRect.right + margin;
        calcTop = clientRect.top + clientRect.height / 2 - tooltipH / 2;

        if (calcLeft + tooltipW > window.innerWidth - 20) {
          calcLeft = Math.max(20, clientRect.left - tooltipW - margin);
        }
      } else if (placement === 'left') {
        calcLeft = clientRect.left - tooltipW - margin;
        calcTop = clientRect.top + clientRect.height / 2 - tooltipH / 2;

        if (calcLeft < 20) {
          calcLeft = clientRect.right + margin;
        }
      }

      // Safe viewport boundary clamps
      const minLeft = 16;
      const maxLeft = Math.max(16, window.innerWidth - tooltipW - 16);
      const minTop = 16;
      const maxTop = Math.max(16, window.innerHeight - tooltipH - 16);

      setTooltipPos({
        top: Math.min(Math.max(calcTop, minTop), maxTop),
        left: Math.min(Math.max(calcLeft, minLeft), maxLeft),
      });
    }
  }, [isTourActive, currentTourStep]);

  // Scroll target element smoothly into view on step change
  useEffect(() => {
    if (!isTourActive || !currentTourStep) return;

    const timer = setTimeout(() => {
      const targetEl = document.querySelector(currentTourStep.targetSelector) as HTMLElement | null;
      if (targetEl) {
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
        setTimeout(updateTargetPosition, 300);
      } else {
        updateTargetPosition();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isTourActive, currentTourStep, tourStepIndex, updateTargetPosition]);

  // Synchronize on resize and scroll
  useEffect(() => {
    if (!isTourActive) return;

    const handleUpdate = () => {
      requestAnimationFrame(updateTargetPosition);
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('scroll', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [isTourActive, updateTargetPosition]);

  // Keyboard navigation: Esc (close), Right (next), Left (prev), Space (pause/play)
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        endTour();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextTourStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevTourStep();
      } else if (e.key === ' ') {
        // Toggle auto-play on spacebar if not focused on an input
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          toggleAutoPlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, endTour, nextTourStep, prevTourStep, toggleAutoPlay]);

  const pad = 8;
  const cutoutX = rect ? Math.max(0, rect.left - pad) : 0;
  const cutoutY = rect ? Math.max(0, rect.top - pad) : 0;
  const cutoutW = rect ? rect.width + pad * 2 : 0;
  const cutoutH = rect ? rect.height + pad * 2 : 0;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'quickadd':
        return <FlashOn sx={{ fontSize: 18, color: '#10B981' }} />;
      case 'radar':
        return <AccountBalanceWalletOutlined sx={{ fontSize: 18, color: '#3B82F6' }} />;
      case 'settle':
        return <Handshake sx={{ fontSize: 18, color: '#10B981' }} />;
      case 'workspaces':
        return <GroupsOutlined sx={{ fontSize: 18, color: '#8B5CF6' }} />;
      case 'fairscore':
        return <EmojiEvents sx={{ fontSize: 18, color: '#F59E0B' }} />;
      default:
        return <SportsEsportsOutlined sx={{ fontSize: 18, color: '#10B981' }} />;
    }
  };

  return (
    <>
      {/* 1. Optional, Non-Intrusive Welcome Quest Banner (Bottom-Right) */}
      {showWelcomePill && !isTourActive && (
        <Box
          className="glass-nav-island animate-fade-in"
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1200,
            p: 1.5,
            px: 2,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(14, 20, 32, 0.92)',
            border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(52, 211, 153, 0.25)'}`,
            boxShadow: isLight
              ? '0 12px 32px rgba(15, 23, 42, 0.12)'
              : '0 20px 45px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2.5,
              bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
              color: isLight ? '#0E6245' : '#34D399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SportsEsportsOutlined sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0, mr: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={750} sx={{ fontSize: '0.84rem', lineHeight: 1.2 }}>
              Explore FairShare
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              60s auto-play tour of real features
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            onClick={() => startTour(0, true)}
            startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: isLight ? '#0E6245' : '#0E6245',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'none',
              borderRadius: 2,
              px: 1.5,
              py: 0.6,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#094A34' },
            }}
          >
            Start Tour
          </Button>
          <IconButton
            size="small"
            onClick={dismissWelcomePill}
            aria-label="Dismiss tour prompt"
            sx={{ color: 'text.secondary', p: 0.5 }}
          >
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      {/* 2. Interactive Spotlight Canvas & Cutout Mask */}
      {isTourActive && currentTourStep && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 99990,
            pointerEvents: 'none',
          }}
        >
          {/* Dimmed Surrounding Mask */}
          <svg
            width="100%"
            height="100%"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <mask id="game-tour-spotlight-mask">
                {/* White canvas reveals dimmed backdrop */}
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {/* Black cutout preserves the target element with clear focus */}
                {rect && (
                  <rect
                    x={cutoutX}
                    y={cutoutY}
                    width={cutoutW}
                    height={cutoutH}
                    rx="14"
                    ry="14"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(4, 7, 13, 0.72)'}
              mask="url(#game-tour-spotlight-mask)"
              style={{ pointerEvents: 'auto' }}
              onClick={endTour}
            />
          </svg>

          {/* Glowing Game Target Frame around Real Element */}
          {rect && (
            <Box
              sx={{
                position: 'fixed',
                top: cutoutY,
                left: cutoutX,
                width: cutoutW,
                height: cutoutH,
                borderRadius: '14px',
                border: '2px solid rgba(16, 185, 129, 0.75)',
                boxShadow: '0 0 24px rgba(16, 185, 129, 0.35), inset 0 0 12px rgba(16, 185, 129, 0.15)',
                pointerEvents: 'none',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 99995,
              }}
            />
          )}

          {/* 3. The Unified Game-Style Tour HUD Card */}
          <Box
            ref={tooltipRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="glass-nav-island animate-fade-in"
            sx={{
              position: 'fixed',
              ...(isMobile
                ? {
                    ...(rect && rect.top > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400)
                      ? { top: 16 }
                      : { bottom: 76 }),
                    left: 14,
                    right: 14,
                    maxWidth: 'calc(100vw - 28px)',
                    mx: 'auto',
                  }
                : {
                    top: tooltipPos ? tooltipPos.top : '50%',
                    left: tooltipPos ? tooltipPos.left : '50%',
                    transform: tooltipPos ? 'none' : 'translate(-50%, -50%)',
                    width: 410,
                    maxWidth: 'calc(100vw - 32px)',
                  }),
              bgcolor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(14, 20, 32, 0.95)',
              borderRadius: 3.5,
              border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'}`,
              boxShadow: isLight
                ? '0 20px 48px -8px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255, 255, 255, 1)'
                : '0 24px 60px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.20)',
              backdropFilter: 'blur(28px) saturate(200%)',
              p: { xs: 2, sm: 2.75 },
              zIndex: 100000,
              pointerEvents: 'auto',
              overflow: 'hidden',
            }}
          >
            {/* Specular Hairline Highlight at Card Top */}
            <Box
              role="presentation"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: isLight
                  ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
                pointerEvents: 'none',
              }}
            />

            {/* Auto-Play Countdown Scrubber Line */}
            {isAutoPlay && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: 3,
                  width: `${autoPlayProgress}%`,
                  bgcolor: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                  transition: 'width 0.05s linear',
                }}
              />
            )}

            {/* HUD Header Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: 1.5,
                    bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {renderIcon(currentTourStep.iconType)}
                </Box>
                <Chip
                  label={currentTourStep.badge}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.675rem',
                    fontWeight: 750,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.14)',
                    color: isLight ? '#0E6245' : '#34D399',
                    border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.15)' : 'rgba(52, 211, 153, 0.25)'}`,
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* Auto-Play Pause / Resume Button */}
                <Button
                  size="small"
                  onClick={toggleAutoPlay}
                  startIcon={isAutoPlay ? <Pause sx={{ fontSize: 13 }} /> : <PlayArrow sx={{ fontSize: 13 }} />}
                  sx={{
                    height: 24,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 9999,
                    px: 1.25,
                    color: isAutoPlay ? (isLight ? '#0E6245' : '#34D399') : 'text.secondary',
                    bgcolor: isAutoPlay
                      ? isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)'
                      : 'transparent',
                    border: `1px solid ${isAutoPlay ? (isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(52, 211, 153, 0.25)') : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)')}`,
                    '&:hover': {
                      bgcolor: isLight ? 'rgba(14, 98, 69, 0.12)' : 'rgba(16, 185, 129, 0.18)',
                    },
                  }}
                >
                  {isAutoPlay ? 'Auto-Play' : 'Paused'}
                </Button>

                <IconButton
                  size="small"
                  onClick={endTour}
                  aria-label="Exit tour"
                  sx={{
                    color: 'text.secondary',
                    p: 0.5,
                    '&:hover': { bgcolor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)' },
                  }}
                >
                  <Close sx={{ fontSize: 17 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Quest Title & Subtitle */}
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                fontSize: '1.025rem',
                lineHeight: 1.25,
                color: 'text.primary',
                letterSpacing: '-0.015em',
                mb: 0.35,
              }}
            >
              {currentTourStep.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: isLight ? '#0E6245' : '#34D399',
                fontWeight: 700,
                fontSize: '0.725rem',
                mb: 1.25,
              }}
            >
              {currentTourStep.subtitle}
            </Typography>

            {/* Quest Description */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: '0.84rem',
                lineHeight: 1.55,
                mb: 2,
              }}
            >
              {currentTourStep.description}
            </Typography>

            {/* Game Tip / Interactive Action Prompt */}
            {currentTourStep.gameTip && (
              <Box
                sx={{
                  p: 1.35,
                  mb: 2.25,
                  borderRadius: 2.5,
                  bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.1,
                }}
              >
                <CheckCircle sx={{ fontSize: 16, color: '#10B981', mt: 0.15, flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.74rem',
                    color: 'text.secondary',
                    fontWeight: 600,
                    lineHeight: 1.45,
                  }}
                >
                  {currentTourStep.gameTip}
                </Typography>
              </Box>
            )}

            {/* Bottom Actions Row & Interactive Dots */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5 }}>
              {/* Quest Step Scrubber Dots */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {TOUR_STEPS.map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => jumpToStep(i)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Jump to quest ${i + 1}`}
                    sx={{
                      width: i === tourStepIndex ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      cursor: 'pointer',
                      bgcolor: i === tourStepIndex
                        ? '#10B981'
                        : isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.22)',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        bgcolor: '#10B981',
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Navigation Controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tourStepIndex > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={prevTourStep}
                    startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)',
                      color: 'text.secondary',
                      px: 1.4,
                      py: 0.55,
                      '&:hover': {
                        borderColor: isLight ? '#0E6245' : '#10B981',
                        color: isLight ? '#0E6245' : '#34D399',
                      },
                    }}
                  >
                    Back
                  </Button>
                )}

                <Button
                  size="small"
                  variant="contained"
                  onClick={nextTourStep}
                  endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    bgcolor: isLight ? '#0E6245' : '#0E6245',
                    color: '#FFFFFF',
                    px: 1.8,
                    py: 0.6,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#094A34' },
                  }}
                >
                  {tourStepIndex === totalTourSteps - 1 ? 'Finish Tour' : 'Next Quest'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
