import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { fadeUpVariant, slideInLeftVariant, slideInRightVariant, buttonHoverVariant } from '@/lib/animations';

/**
 * Hero section component for the landing page
 * This is the main section that visitors see first
 */
const LandingHero = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.section 
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { 
            staggerChildren: 0.2,
            delayChildren: 0.3
          }
        }
      }}
      className="w-full py-24 md:py-36 lg:py-40 xl:py-48 bg-[#0a0c16] border-b border-[#1a1e36]/40 relative overflow-hidden"
    >
      {/* Soccer field pattern background - subtle overlay with parallax */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-cover bg-center" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
          backgroundBlendMode: "overlay",
          mixBlendMode: "luminosity"
        }}
      ></motion.div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <motion.h1 
            variants={fadeUpVariant}
            custom={0}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-[#4d79ff] mb-4"
          >
            For Soccer Tournament Directors.
          </motion.h1>
          <motion.h2 
            variants={fadeUpVariant}
            custom={1}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-[#4d79ff] mb-12"
          >
            By Soccer Tournament Directors.
          </motion.h2>
          
          <div className="max-w-3xl mx-auto">
            <motion.p 
              variants={fadeUpVariant}
              custom={2}
              className="text-base md:text-lg text-gray-300 mb-6"
            >
              Our software is built with adaptability at its core. From player development to game-day management, we're constantly iterating, refining, and pushing boundaries. Every update, every feature, and every integration is driven by real-world feedback and forward-thinking strategy.
            </motion.p>
            <motion.p 
              variants={fadeUpVariant}
              custom={3}
              className="text-base md:text-lg text-gray-300 mb-12"
            >
              We envision a sports ecosystem where data isn't just collected, it's translated into actionable insight — where coaches, players, and organizations are empowered by software that grows with the game.
            </motion.p>
          </div>
          
          <motion.div 
            variants={fadeUpVariant}
            custom={4}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register">
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={buttonHoverVariant}
              >
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-8">
                  Get Started
                </Button>
              </motion.div>
            </Link>
            <Link href="/#features">
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={buttonHoverVariant}
              >
                <Button size="lg" variant="outline" className="text-gray-300 border-gray-600 hover:bg-[#1a1e36] hover:text-white">
                  Learn More
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>

        {/* Animated soccer ball */}
        <motion.div
          className="absolute -bottom-10 -right-10 md:bottom-10 md:right-10 opacity-10 md:opacity-20 hidden md:block"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#4d79ff" />
            <path d="M85,50 A35,35 0 0,1 50,85 A35,35 0 0,1 15,50 A35,35 0 0,1 50,15 A35,35 0 0,1 85,50 Z" fill="none" stroke="white" strokeWidth="2" />
            <path d="M50,15 L50,85 M15,50 L85,50 M24,24 L76,76 M24,76 L76,24" stroke="white" strokeWidth="2" />
          </svg>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default LandingHero;