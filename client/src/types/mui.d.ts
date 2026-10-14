import '@mui/material/Typography';
import '@mui/material/TextField';
import '@mui/material/Dialog';
import '@mui/material/Menu';
import '@mui/material/ListItemText';
import '@mui/material/Stack';

declare module '@mui/material/Typography' {
  interface TypographyOwnProps {
    fontWeight?: number | string;
    fontSize?: number | string;
    lineHeight?: number | string;
    textAlign?: string;
  }
}

declare module '@mui/material/TextField' {
  interface BaseTextFieldProps {
    InputProps?: any;
    inputProps?: any;
    InputLabelProps?: any;
  }
}

declare module '@mui/material/Dialog' {
  interface DialogProps {
    PaperProps?: any;
  }
}

declare module '@mui/material/Menu' {
  interface MenuProps {
    PaperProps?: any;
  }
}

declare module '@mui/material/ListItemText' {
  interface ListItemTextProps {
    primaryTypographyProps?: any;
    secondaryTypographyProps?: any;
  }
}

declare module '@mui/material/Stack' {
  interface StackOwnProps {
    justifyContent?: any;
    alignItems?: any;
  }
}
