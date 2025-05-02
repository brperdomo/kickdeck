import React, { useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Map, 
  Brain, 
  CreditCard, 
  ClipboardList, 
  Clock, 
  Shield 
} from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { fadeUpVariant, scaleVariant, staggerContainer } from '@/lib/animations';

/**
 * Features section for the landing page
 * Showcases the key features of the MatchPro platform
 */
const LandingFeatures = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-[#4d79ff]" />,
      title: "Smart Scheduling",
      description: "AI-powered tournament scheduling optimizes field usage and minimizes conflicts."
    },
    {
      icon: <Users className="h-8 w-8 text-[#4d79ff]" />,
      title: "Team Management",
      description: "Comprehensive tools for managing teams, players, and registrations with ease."
    },
    {
      icon: <Map className="h-8 w-8 text-[#4d79ff]" />,
      title: "Facility Management",
      description: "Track and manage fields, complexes, and resources efficiently."
    },
    {
      icon: <Brain className="h-8 w-8 text-[#4d79ff]" />,
      title: "AI-Driven Insights",
      description: "Get intelligent recommendations and data-driven insights for better decisions."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-[#4d79ff]" />,
      title: "Payment Processing",
      description: "Secure, integrated payment processing for registrations and fees."
    },
    {
      icon: <ClipboardList className="h-8 w-8 text-[#4d79ff]" />,
      title: "Custom Forms",
      description: "Create tailored registration forms and collect exactly the data you need."
    },
    {
      icon: <Clock className="h-8 w-8 text-[#4d79ff]" />,
      title: "Time-Saving Automation",
      description: "Automate repetitive tasks to focus on what matters most."
    },
    {
      icon: <Shield className="h-8 w-8 text-[#4d79ff]" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security to protect sensitive player and payment information."
    }
  ];

  return (
    <motion.section 
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
      className="w-full py-12 md:py-24 lg:py-32 bg-[#0a0c16] border-b border-[#1a1e36]/40" 
      id="features"
    >
      <div className="container px-4 md:px-6">
        <motion.div 
          variants={fadeUpVariant}
          className="flex flex-col items-center justify-center space-y-4 text-center"
        >
          <div className="space-y-2">
            <motion.div 
              variants={scaleVariant}
              className="inline-block rounded-lg bg-[#1a1e36] px-3 py-1 text-sm text-[#4d79ff] font-medium"
            >
              Features
            </motion.div>
            <motion.h2 
              variants={fadeUpVariant}
              className="text-3xl font-bold tracking-tighter sm:text-4xl text-white mt-6"
            >
              Powerful Tools for Tournament Management
            </motion.h2>
            <motion.p 
              variants={fadeUpVariant}
              className="max-w-[900px] text-gray-300 md:text-lg mt-4"
            >
              MatchPro.ai combines cutting-edge technology with intuitive design to streamline every aspect of soccer tournament management.
            </motion.p>
          </div>
        </motion.div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={fadeUpVariant}
              custom={index * 0.1}
              whileHover={{ 
                y: -10,
                boxShadow: "0px 10px 20px rgba(26, 30, 54, 0.3)",
                borderColor: "#4d79ff",
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex flex-col items-center space-y-4 rounded-lg border border-[#1a1e36] bg-[#0e1019] p-6"
            >
              <motion.div 
                whileHover={{ 
                  rotate: 360,
                  scale: 1.1,
                  backgroundColor: "#4d79ff",
                  transition: { duration: 0.5 }
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1e36]"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-lg font-bold text-white">{feature.title}</h3>
              <p className="text-center text-sm text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default LandingFeatures;