import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  variant?: string;
};

export function Button({ className = "", variant, ...props }: ButtonProps) {
  // If variant is 'trainee', use gradient style
  const traineeClass = "w-full h-12 flex flex-row items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base border-0 shadow-none hover:scale-[1.02]";
  const finalClass = variant === "trainee"
    ? `${traineeClass} ${className}`
    : className;
  return <button className={finalClass} {...props} />;
}
