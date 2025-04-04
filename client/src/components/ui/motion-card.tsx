import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface MotionCardProps {
  className?: string;
  delay?: number;
  animate?: boolean;
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export function MotionCard({
  className,
  delay = 0,
  animate = true,
  hoverEffect = true,
  children,
}: MotionCardProps) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : undefined}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: delay,
      }}
    >
      <Card className={cn(className)}>
        {children}
      </Card>
    </motion.div>
  );
}