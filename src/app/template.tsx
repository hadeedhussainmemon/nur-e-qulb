'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Skip animations on auth pages or error pages if preferred, but general crossfade is usually nice
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20 
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
