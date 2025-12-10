import React, { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;
export function Input(props: InputProps) {
  return <input {...props} className={`border rounded px-3 py-2 ${props.className || ""}`} />;
}
