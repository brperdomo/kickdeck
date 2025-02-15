
import { cn } from "@/lib/utils";

interface VideoBackgroundProps {
  className?: string;
}

export function VideoBackground({ className }: VideoBackgroundProps) {
  const videos = [
    "/videos/soccer1.mp4",
    "/videos/soccer2.mp4"
  ];

  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        {videos.map((src, index) => (
          <source key={index} src={src} type="video/mp4" />
        ))}
      </video>
      <div className="absolute inset-0 bg-black/20" /> {/* Overlay for better text readability */}
    </div>
  );
}
