"use client";

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

type LoadingOverlayProps = {
  open: boolean;
  message?: string;
  mode?: "blocking" | "inline";
};

export function LoadingOverlay({ open, message, mode = "blocking" }: LoadingOverlayProps) {
  if (!open) return null;

  if (mode === "inline") {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-900/70">
        <CircularProgress sx={{ color: "#60a5fa" }} />
        {message && <p className="text-sm text-gray-200">{message}</p>}
      </div>
    );
  }

  return (
    <Backdrop
      open={open}
      sx={{
        color: "#fff",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: "column",
        gap: 2,
      }}
    >
      <CircularProgress color="inherit" />
      {message && <p className="text-sm text-gray-200">{message}</p>}
    </Backdrop>
  );
}
