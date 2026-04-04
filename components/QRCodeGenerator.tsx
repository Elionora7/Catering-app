'use client'

import QRCode from "react-qr-code";
import { useState } from 'react'

interface QRCodeGeneratorProps {
  url: string
  title?: string
  size?: number
}

export function QRCodeGenerator({
  url,
  title = 'Scan to view menu',
  size = 256,
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="p-4 rounded-lg border-2"
        style={{ backgroundColor: "#ffffff", color: "#1f2937" }}
        >
        <QRCode
            value={url}
            size={size}
            level="H"
            style={{ height: size, width: size }}
        />
        </div>
      <div className="w-full max-w-xs">
        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded border">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 text-xs text-gray-600 bg-transparent border-none outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-xs bg-[#D4AF37] text-white rounded hover:opacity-90 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 text-center">
        Scan with your phone camera to view the menu
      </p>
    </div>
  )
}





