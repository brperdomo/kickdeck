import { cn } from "../../lib/utils";

interface VideoBackgroundProps {
  className?: string;
}

export function VideoBackground({ className }: VideoBackgroundProps) {
  return (
    <div className={cn("absolute inset-0 -z-10", className)}>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/videos/soccer1.mp4" type="video/mp4" />
        <source src="/videos/soccer2.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}