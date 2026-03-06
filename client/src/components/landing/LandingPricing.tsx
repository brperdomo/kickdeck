import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

/**
 * Pricing section for the landing page
 * Shows available pricing plans and features
 */
const LandingPricing = () => {
  const plans = [
    {
      name: "Basic",
      price: "$99",
      period: "per month",
      description: "Ideal for small clubs and organizations",
      features: [
        "Up to 20 teams",
        "Basic scheduling tools",
        "Team registration",
        "Email notifications",
        "Standard support",
        "1 admin user"
      ],
      cta: "Get Started",
      isPopular: false,
      variant: "outline"
    },
    {
      name: "Pro",
      price: "$249",
      period: "per month",
      description: "Perfect for growing leagues and tournaments",
      features: [
        "Up to 100 teams",
        "AI-powered scheduling",
        "Custom registration forms",
        "Payment processing",
        "Priority support",
        "5 admin users"
      ],
      cta: "Get Started",
      isPopular: true,
      variant: "default"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large organizations with complex needs",
      features: [
        "Unlimited teams",
        "Advanced AI scheduling",
        "Custom integrations",
        "Data analytics",
        "24/7 premium support",
        "Unlimited admin users"
      ],
      cta: "Contact Sales",
      isPopular: false,
      variant: "outline"
    }
  ];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-[#0a0c16] border-b border-[#1a1e36]/40" id="pricing">
      <div className="container max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center w-full">
          <div className="space-y-2 w-full">
            <div className="inline-block rounded-lg bg-[#1a1e36] px-3 py-1 text-sm text-[#4d79ff] font-medium">
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white mt-6">
              Choose the Right Plan for Your Organization
            </h2>
            <p className="max-w-[1000px] mx-auto text-gray-300 md:text-xl mt-6">
              Affordable solutions for organizations of all sizes. All plans include core KickDeck features.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-full grid-cols-1 gap-8 py-16 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`flex flex-col rounded-lg border border-[#1a1e36] ${plan.isPopular ? 'border-[#4d79ff] bg-[#131724]' : 'bg-[#0e1019]'} p-6 space-y-6`}
            >
              {plan.isPopular && (
                <div className="rounded-full bg-[#4d79ff]/20 px-3 py-1 text-xs font-medium text-[#4d79ff] w-fit">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="ml-1 text-sm text-gray-400">/{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-[#4d79ff]" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4">
                <Link href={plan.name === "Enterprise" ? "/#contact" : "/register"}>
                  <Button 
                    className={`w-full ${plan.isPopular 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white' 
                      : 'bg-transparent border border-[#1a1e36] text-gray-300 hover:bg-[#1a1e36] hover:text-white'}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-gray-400">
            All plans include a 14-day free trial. No credit card required to start.
            Need a custom solution? <Link href="/#contact" className="text-[#4d79ff] hover:underline">Contact our sales team</Link>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;