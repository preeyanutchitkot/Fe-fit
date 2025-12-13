"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleAuthButtonProps {
  onSuccess: (response: { credential: string }) => void;
  onError?: () => void;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
}) => {
  const buttonDiv = useRef<HTMLDivElement>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      setIsSdkLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isSdkLoaded || !buttonDiv.current || !window.google?.accounts?.id) return;

    // Clean up previous button if any
    buttonDiv.current.innerHTML = "";

    try {
      window.google.accounts.id.initialize({
        client_id:
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          process.env.REACT_APP_GOOGLE_CLIENT_ID ||
          "YOUR_GOOGLE_CLIENT_ID",
        callback: (response: any) => {
          if (response && response.credential) {
            onSuccess({ credential: response.credential });
          } else {
            onError && onError();
          }
        },
        ux_mode: "popup",
      });

      window.google.accounts.id.renderButton(buttonDiv.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        logo_alignment: "left",
        shape: "pill",
      });
    } catch (error) {
      console.error("Google Auth Initialization Error:", error);
    }
  }, [isSdkLoaded, onSuccess, onError]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
        onLoad={() => setIsSdkLoaded(true)}
      />
      <div className="w-full flex justify-center items-center mb-4">
        <div ref={buttonDiv} className="w-full flex justify-center min-h-[40px]" />
      </div>
    </>
  );
};

export default GoogleAuthButton;
