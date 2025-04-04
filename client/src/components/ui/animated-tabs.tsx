import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface AnimatedTabsProps {
  defaultValue: string;
  className?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
}

export function AnimatedTabs({
  defaultValue,
  className,
  onChange,
  children,
}: AnimatedTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className={className} onValueChange={onChange}>
      {children}
    </Tabs>
  );
}

interface AnimatedTabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function AnimatedTabsList({
  className,
  children,
}: AnimatedTabsListProps) {
  return (
    <TabsList className={className}>
      {children}
    </TabsList>
  );
}

export function AnimatedTabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger value={value} className={className}>
      {children}
    </TabsTrigger>
  );
}

export function AnimatedTabsContent({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContent value={value} className="outline-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </TabsContent>
  );
}