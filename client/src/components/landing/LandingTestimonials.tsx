import React, { useEffect } from 'react';
import { 
  Star,
  Quote 
} from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { fadeUpVariant, scaleVariant, staggerContainer } from '@/lib/animations';

/**
 * Testimonials section for the landing page
 * Shows customer quotes and reviews
 */
const LandingTestimonials = () => {
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

  const testimonials = [
    {
      quote: "MatchPro.ai transformed how we manage our youth soccer league. The AI scheduling alone saved us countless hours of work.",
      author: "Sarah Johnson",
      title: "Tournament Director",
      organization: "Youth Soccer Association"
    },
    {
      quote: "The team registration process is seamless, and our coaches love the intuitive interface. It's been a game-changer for our club.",
      author: "Michael Rodriguez",
      title: "Club President",
      organization: "Metro FC"
    },
    {
      quote: "We've reduced administrative work by 70% since implementing MatchPro. Their customer support team is also incredibly responsive.",
      author: "David Chen",
      title: "League Administrator",
      organization: "Regional Soccer League"
    }
  ];

  return (
    <motion.section 
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
      className="w-full py-12 md:py-24 lg:py-32 bg-[#0a0c16] border-b border-[#1a1e36]/40" 
      id="testimonials"
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
              Testimonials
            </motion.div>
            <motion.h2 
              variants={fadeUpVariant}
              className="text-3xl font-bold tracking-tighter sm:text-4xl text-white mt-6"
            >
              Trusted by Soccer Organizations
            </motion.h2>
            <motion.p 
              variants={fadeUpVariant}
              className="max-w-[900px] text-gray-300 md:text-lg mt-4"
            >
              See what tournament directors, club presidents, and league administrators are saying about MatchPro.ai.
            </motion.p>
          </div>
        </motion.div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              variants={fadeUpVariant}
              custom={index}
              whileHover={{ 
                y: -8, 
                boxShadow: "0px 10px 30px rgba(77, 121, 255, 0.2)",
                borderColor: "#4d79ff",
              }}
              className="flex flex-col justify-between space-y-4 rounded-lg border border-[#1a1e36] bg-[#0e1019] p-6"
            >
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1), duration: 0.5 }}
                  className="flex items-center"
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + ((index * 0.1) + (i * 0.05)), duration: 0.3 }}
                    >
                      <Star className="h-4 w-4 fill-[#4d79ff] text-[#4d79ff] mr-1" />
                    </motion.div>
                  ))}
                </motion.div>
                <div className="relative pl-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + (index * 0.1), duration: 0.3 }}
                  >
                    <Quote className="absolute left-0 top-0 h-4 w-4 text-[#4d79ff]/60" />
                  </motion.div>
                  <motion.p 
                    variants={fadeUpVariant}
                    className="text-gray-300"
                  >
                    "{testimonial.quote}"
                  </motion.p>
                </div>
              </div>
              <motion.div
                variants={fadeUpVariant}
                custom={2 + index}
              >
                <div className="font-semibold text-white">{testimonial.author}</div>
                <div className="text-sm text-gray-400">
                  {testimonial.title}, {testimonial.organization}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default LandingTestimonials;