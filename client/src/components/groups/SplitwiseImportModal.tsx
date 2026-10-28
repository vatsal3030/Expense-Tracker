'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  Button, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Alert, CircularProgress,
  IconButton, Stack, RadioGroup, FormControlLabel, Radio, Tooltip,
  Grid, useTheme,
} from '@mui/material';
import {
  CloudUpload, Close, ArrowForward, CheckCircle, WarningAmber,
  FileDownload, AutoAwesome, Group, SwapHoriz,
} from '@mui/icons-material';
import { exportApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface SplitwiseImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
  currentUserName?: string;
}

interface ParsedExpenseRow {
  date: string;
  description: string;
  category: string;
  cost: number;
  currency: string;
  shares: Record<string, number>;
}

interface MemberMapping {
  columnName: string;
  isCurrentUser: boolean;
  guestEmail?: string;
}

const SAMPLE_CSV = `Date,Description,Category,Cost,Currency,Alice,Bob,Charlie
2026-10-20,"Goa Beach Shack Dinner","Dining out",2400.00,INR,1600.00,-800.00,-800.00
2026-10-21,"Self-Drive Car Rental","Taxi",3000.00,INR,-1000.00,2000.00,-1000.00
2026-10-22,"Supermarket Supplies","Groceries",1200.00,INR,-400.00,-400.00,800.00
2026-10-23,"Settle up","Payment",800.00,INR,-800.00,800.00,0.00`;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default function SplitwiseImportModal({
  open,
  onClose,
  onSuccess,
  currentUserName = 'You',
}: SplitwiseImportModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('TRIP');
  const [detectedCurrency, setDetectedCurrency] = useState('INR');
  const [members, setMembers] = useState<MemberMapping[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedExpenseRow[]>([]);
  const [currentUserCol, setCurrentUserCol] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    groupId: string;
    groupName: string;
    expensesCount: number;
    settlementsCount: number;
    membersCount: number;
  } | null>(null);

  const handleReset = () => {
    setStep(1);
    setFileName('');
    setGroupName('');
    setMembers([]);
    setParsedRows([]);
    setCurrentUserCol('');
    setError(null);
    setImportSummary(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processCsvText = (csvText: string, suggestedName: string) => {
    try {
      setError(null);
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('CSV file is empty or does not contain a header and data rows.');
      }

      const header = parseCsvLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());

      // Identify standard column indexes
      let dateIdx = -1;
      let descIdx = -1;
      let catIdx = -1;
      let costIdx = -1;
      let currIdx = -1;

      header.forEach((col, idx) => {
        const lower = col.toLowerCase();
        if (lower === 'date' && dateIdx === -1) dateIdx = idx;
        else if ((lower === 'description' || lower === 'details') && descIdx === -1) descIdx = idx;
        else if (lower === 'category' && catIdx === -1) catIdx = idx;
        else if ((lower === 'cost' || lower === 'amount' || lower === 'total') && costIdx === -1) costIdx = idx;
        else if (lower === 'currency' && currIdx === -1) currIdx = idx;
      });

      if (descIdx === -1 || costIdx === -1) {
        throw new Error('CSV format unrecognized. Expected at least "Description" and "Cost" columns.');
      }

      // Member columns: columns that are NOT date, desc, cat, cost, or curr
      const standardIndexes = new Set([dateIdx, descIdx, catIdx, costIdx, currIdx]);
      const memberCols: string[] = [];

      header.forEach((col, idx) => {
        if (!standardIndexes.has(idx) && col.length > 0) {
          memberCols.push(col);
        }
      });

      if (memberCols.length < 2) {
        throw new Error(`Found only ${memberCols.length} member column(s) in CSV header. At least 2 members are required.`);
      }

      // Parse data rows
      const rows: ParsedExpenseRow[] = [];
      let foundCurrency = 'INR';

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length < 2) continue;

        const date = dateIdx !== -1 && values[dateIdx] ? values[dateIdx] : new Date().toISOString();
        const description = descIdx !== -1 && values[descIdx] ? values[descIdx] : 'Expense';
        const category = catIdx !== -1 && values[catIdx] ? values[catIdx] : 'General';
        const rawCost = costIdx !== -1 && values[costIdx] ? values[costIdx].replace(/[^0-9.-]/g, '') : '0';
        const cost = Math.abs(parseFloat(rawCost) || 0);

        if (currIdx !== -1 && values[currIdx] && values[currIdx].length === 3) {
          foundCurrency = values[currIdx].toUpperCase();
        }

        const shares: Record<string, number> = {};
        memberCols.forEach((mCol) => {
          const mIdx = header.indexOf(mCol);
          if (mIdx !== -1 && values[mIdx]) {
            const rawDelta = values[mIdx].replace(/[^0-9.-]/g, '');
            shares[mCol] = parseFloat(rawDelta) || 0;
          } else {
            shares[mCol] = 0;
          }
        });

        if (cost > 0) {
          rows.push({
            date,
            description,
            category,
            cost,
            currency: foundCurrency,
            shares,
          });
        }
      }

      if (rows.length === 0) {
        throw new Error('No valid expense rows found in the uploaded file.');
      }

      // Auto-match "You" to the column that matches current user name
      let defaultYou = memberCols[0];
      const normalizedCurrent = currentUserName.toLowerCase().trim();
      const match = memberCols.find(
        (m) =>
          m.toLowerCase().trim() === normalizedCurrent ||
          m.toLowerCase().includes(normalizedCurrent) ||
          normalizedCurrent.includes(m.toLowerCase())
      );
      if (match) defaultYou = match;

      setDetectedCurrency(foundCurrency);
      setParsedRows(rows);
      setGroupName(suggestedName.replace(/(_expenses|_splitwise|\.csv)/gi, '').replace(/[_-]/g, ' ').trim() || 'Splitwise Imported Group');
      setCurrentUserCol(defaultYou);
      setMembers(
        memberCols.map((col) => ({
          columnName: col,
          isCurrentUser: col === defaultYou,
        }))
      );
      setStep(2);
    } catch (err: any) {
      console.error('CSV parse error:', err);
      setError(err.message || 'Failed to parse Splitwise CSV file.');
    }
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        processCsvText(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFileName('Goa_Trip_Splitwise_Export.csv');
    processCsvText(SAMPLE_CSV, 'Goa Trip 2026');
  };

  const handleSelectCurrentUser = (colName: string) => {
    setCurrentUserCol(colName);
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        isCurrentUser: m.columnName === colName,
      }))
    );
  };

  const handleExecuteImport = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        groupName: groupName.trim(),
        groupType,
        currency: detectedCurrency,
        membersMapping: members.map((m) => ({
          columnName: m.columnName,
          isCurrentUser: m.isCurrentUser,
          guestEmail: m.guestEmail || undefined,
        })),
        expenses: parsedRows,
      };

      const res = await exportApi.importSplitwise(payload);
      if (res.data?.success && res.data?.data) {
        setImportSummary(res.data.data);
        setStep(3);
        if (onSuccess) {
          onSuccess(res.data.data.groupId);
        }
      } else {
        throw new Error(res.data?.error || 'Migration failed.');
      }
    } catch (err: any) {
      console.error('Splitwise import execution error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to complete migration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important',
          },
        },
        paper: {
          sx: {
            borderRadius: 4,
            bgcolor: '#0F131C',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Header Banner */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 100%)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              bgcolor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AutoAwesome sx={{ color: '#10B981', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
              Migrate from Splitwise
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Zero limits • 100% free • Import all historical balances in 1-click
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* STEP 1: FILE UPLOAD */}
        {step === 1 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: 'text.primary' }}>
              Upload your Splitwise Export (.csv)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              In Splitwise: open your group → tap Group Settings (Gear icon) → choose{' '}
              <strong style={{ color: '#10B981' }}>Export as spreadsheet (.csv)</strong> and drop it below.
            </Typography>

            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                p: { xs: 4, sm: 6 },
                border: '2px dashed',
                borderColor: dragOver ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
                borderRadius: 4,
                bgcolor: dragOver ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#10B981',
                  bgcolor: 'rgba(16, 185, 129, 0.04)',
                },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <CloudUpload sx={{ fontSize: 48, color: '#10B981', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
                Drag & drop your Splitwise CSV here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to browse from your device
              </Typography>
              <Chip label="Supports all Splitwise group exports" size="small" variant="outlined" sx={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34D399' }} />
            </Box>

            {/* Test Sample Demo Button */}
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2.5, bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  Don&apos;t have a file ready?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Try out the migration engine with a pre-formatted 4-expense Goa Trip sample.
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={handleLoadSample}
                startIcon={<FileDownload />}
                sx={{ textTransform: 'none', borderRadius: 2, borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10B981' }}
              >
                Load Sample CSV
              </Button>
            </Box>
          </Box>
        )}

        {/* STEP 2: COLUMN MAPPING & PREVIEW */}
        {step === 2 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                  Verify Group & Members
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Parsed from <strong style={{ color: '#10B981' }}>{fileName}</strong>
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={`${parsedRows.length} Expenses`} color="success" size="small" />
                <Chip label={`${members.length} Members`} color="primary" size="small" />
                <Chip label={`Currency: ${detectedCurrency}`} variant="outlined" size="small" />
              </Stack>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="FairShare Group Name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Group Type"
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                >
                  <MenuItem value="TRIP">✈️ Trip</MenuItem>
                  <MenuItem value="HOME">🏠 Home / Rent</MenuItem>
                  <MenuItem value="FRIENDS">👥 Friends</MenuItem>
                  <MenuItem value="COUPLE">❤️ Couple</MenuItem>
                  <MenuItem value="OFFICE">🏢 Office</MenuItem>
                  <MenuItem value="PROJECT">💼 Project</MenuItem>
                  <MenuItem value="OTHER">✨ Other</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Member Designation: Which Column is YOU? */}
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={750} sx={{ mb: 0.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group sx={{ fontSize: 18, color: '#10B981' }} /> Which member column is YOU?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Select your name in the CSV so FairShare links your personal balances and settlement flows correctly.
              </Typography>

              <RadioGroup value={currentUserCol} onChange={(e) => handleSelectCurrentUser(e.target.value)}>
                <Grid container spacing={1.5}>
                  {members.map((m) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.columnName}>
                      <Box
                        onClick={() => handleSelectCurrentUser(m.columnName)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: m.columnName === currentUserCol ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                          bgcolor: m.columnName === currentUserCol ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FormControlLabel
                            value={m.columnName}
                            control={<Radio size="small" sx={{ color: '#10B981', '&.Mui-checked': { color: '#10B981' } }} />}
                            label={<Typography variant="body2" fontWeight={700}>{m.columnName}</Typography>}
                            sx={{ m: 0 }}
                          />
                        </Box>
                        {m.columnName === currentUserCol ? (
                          <Chip label="Your Account" size="small" sx={{ bgcolor: '#10B981', color: '#0A0D14', fontWeight: 800, fontSize: '0.65rem' }} />
                        ) : (
                          <Chip label="Guest Member" size="small" variant="outlined" sx={{ fontSize: '0.65rem', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            </Box>

            {/* Preview First 3 Transactions */}
            <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
              Preview (First {Math.min(parsedRows.length, 3)} of {parsedRows.length} Expenses)
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2.5, border: '1px solid rgba(255, 255, 255, 0.05)', mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }} align="right">Cost</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }} align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedRows.slice(0, 3).map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>{r.description}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{r.category}</TableCell>
                      <TableCell sx={{ color: '#34D399', fontWeight: 700 }} align="right">
                        {detectedCurrency} {r.cost.toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }} align="right">
                        {new Date(r.date).toLocaleDateString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* STEP 3: SUCCESS MIGRATION */}
        {step === 3 && importSummary && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <CheckCircle sx={{ fontSize: 44, color: '#10B981' }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', mb: 1 }}>
              Migration Completed! ✓
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}>
              Your Splitwise group <strong style={{ color: '#10B981' }}>{importSummary.groupName}</strong> has been created with all transactions and minimized debts ready.
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255, 255, 255, 0.03)', minWidth: 120 }}>
                <Typography variant="h5" fontWeight={800} color="#10B981">
                  {importSummary.expensesCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Expenses Imported
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255, 255, 255, 0.03)', minWidth: 120 }}>
                <Typography variant="h5" fontWeight={800} color="#3B82F6">
                  {importSummary.membersCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Members
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255, 255, 255, 0.03)', minWidth: 120 }}>
                <Typography variant="h5" fontWeight={800} color="#F59E0B">
                  {importSummary.settlementsCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Settlements Logged
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              size="large"
              onClick={() => {
                handleClose();
                router.push(`/groups/${importSummary.groupId}`);
              }}
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: '#10B981',
                color: '#0A0D14',
                fontWeight: 800,
                px: 4,
                py: 1.5,
                borderRadius: 2.5,
                '&:hover': { bgcolor: '#059669' },
              }}
            >
              Open Migrated Group Now
            </Button>
          </Box>
        )}
      </DialogContent>

      {/* Modal Actions */}
      {step !== 3 && (
        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
          {step === 2 ? (
            <Button
              onClick={() => setStep(1)}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              ← Back to File Upload
            </Button>
          ) : (
            <Box />
          )}

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={handleClose}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              Cancel
            </Button>
            {step === 2 && (
              <Button
                variant="contained"
                onClick={handleExecuteImport}
                disabled={loading || !groupName.trim() || members.length < 2}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SwapHoriz />}
                sx={{
                  bgcolor: '#10B981',
                  color: '#0A0D14',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 3,
                  '&:hover': { bgcolor: '#059669' },
                }}
              >
                {loading ? 'Migrating Group...' : `Migrate ${parsedRows.length} Expenses to FairShare`}
              </Button>
            )}
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
}
