import React from "react";

type FilterProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export const Filter: React.FC<FilterProps> = ({
  value,
  onChange,
  placeholder = "Filter...",
  className,
}) => {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
};
