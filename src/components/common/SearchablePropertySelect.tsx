"use client";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

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

export function SearchablePropertySelect({
  propertyNames,
  value,
  onChange,
  label,
  placeholder,
}: {
  propertyNames: string[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
}) {
  return (
    <Autocomplete
      options={propertyNames}
      value={value || null}
      onChange={(_, next) => onChange(next ?? "")}
      sx={{ minWidth: 220, ...darkSx }}
      slotProps={darkSlotProps}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder ?? "Search…"} />
      )}
    />
  );
}
