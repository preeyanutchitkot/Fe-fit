import React from "react";
export function Card({ className = "", ...props }) {
  return <div className={`bg-white rounded-xl shadow ${className}`} {...props} />;
}
