import React from 'react'

interface AppLogoProps {
  size?: number
  className?: string
}

export default function AppLogo({ size = 48, className = '' }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="6" y="6" width="54" height="54" rx="14" fill="#1C1917" />
      <rect
        x="3"
        y="3"
        width="54"
        height="54"
        rx="14"
        fill="#E84A27"
        stroke="#1C1917"
        strokeWidth="2.5"
      />
      <path
        d="M25.5 17C25.5 12.5 34.5 12.5 34.5 16.5C34.5 19.5 30 20 30 23"
        stroke="#F4B942"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="30" cy="27.5" r="1.9" fill="#F4B942" />
      <path
        d="M36 31.5L46.5 20.5"
        stroke="#1C1917"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M39.5 32L48.5 23.5"
        stroke="#1C1917"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M14.5 32H45.5C45.5 41.5 38.8 46.5 30 46.5C21.2 46.5 14.5 41.5 14.5 32Z"
        fill="#FAF7F2"
        stroke="#1C1917"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 46.5L25.5 49.5H34.5L36 46.5"
        fill="#FAF7F2"
        stroke="#1C1917"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M20 36C21 39.5 24 41.5 27.5 42"
        stroke="#E84A27"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
    </svg>
  )
}
