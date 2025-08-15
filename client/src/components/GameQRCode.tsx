import { QRCodeSVG } from "qrcode.react";

interface GameQRCodeProps {
  gameId: number;
  size?: number;
}

export default function GameQRCode({ gameId, size = 128 }: GameQRCodeProps) {
  // Create direct game URL for score submission
  const gameUrl = `${window.location.origin}/game/${gameId}`;
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <QRCodeSVG 
        value={gameUrl} 
        size={size}
        level="M" // Medium error correction
        includeMargin={true}
      />
      <div className="text-xs text-gray-600 text-center max-w-[150px]">
        Scan to enter/edit scores
      </div>
    </div>
  );
}