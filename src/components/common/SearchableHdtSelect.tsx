"use client";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

type Common = {
  hdtIds: string[];
  label?: string;
  disabled?: boolean;
};

type SingleProps = Common & {
  multiple?: false;
  value: string | null;
  onChange: (v: string | null) => void;
};

type MultiProps = Common & {
  multiple: true;
  value: string[];
  onChange: (v: string[]) => void;
};

const darkSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#1f2937",
    color: "#fff",
    "& fieldset": {
      borderColor: "#4b5563",
    },
    "&:hover fieldset": {
      borderColor: "#6b7280",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#60a5fa",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#9ca3af",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#60a5fa",
  },
  "& .MuiSvgIcon-root": {
    color: "#d1d5db",
  },
  "& .MuiChip-root": {
    backgroundColor: "#374151",
    color: "#fff",
  },
};

const darkSlotProps = {
  paper: {
    sx: {
      backgroundColor: "#1f2937",
      color: "#fff",
      "& .MuiAutocomplete-option": {
        '&[aria-selected="true"]': {
          backgroundColor: "#374151",
        },
        "&:hover": {
          backgroundColor: "#374151",
        },
      },
      "& .MuiAutocomplete-noOptions": {
        color: "#9ca3af",
      },
    },
  },
};

export function SearchableHdtSelect(props: SingleProps | MultiProps) {
  const { hdtIds, label, disabled } = props;

  if (props.multiple) {
    const { value, onChange } = props;
    return (
      <Autocomplete
        multiple
        disabled={disabled}
        options={hdtIds}
        value={value}
        onChange={(_, next) => onChange(next)}
        disableCloseOnSelect
        sx={darkSx}
        slotProps={darkSlotProps}
        renderInput={(params) => (
          <TextField {...params} label={label ?? "Digital Twins"} placeholder="Search…" />
        )}
      />
    );
  }

  const { value, onChange } = props;
  return (
    <Autocomplete
      disabled={disabled}
      options={hdtIds}
      value={value}
      onChange={(_, next) => onChange(next)}
      sx={darkSx}
      slotProps={darkSlotProps}
      renderInput={(params) => (
        <TextField {...params} label={label ?? "Digital Twin"} placeholder="Search…" />
      )}
    />
  );
}
