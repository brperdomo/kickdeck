import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';

/**
 * Contact section for the landing page
 * Provides a contact form and contact information
 */
const LandingContact = () => {
  // In a real application, you would implement form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle the form submission
    // For now, we'll just show an alert
    alert("Thank you for your message. Our team will contact you soon!");
  };

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-[#0a0c16] border-b border-[#1a1e36]/40" id="contact">
      <div className="container max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center w-full">
          <div className="space-y-2 w-full">
            <div className="inline-block rounded-lg bg-[#1a1e36] px-3 py-1 text-sm text-[#4d79ff] font-medium">
              Contact Us
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white mt-6">
              Get in Touch with Our Team
            </h2>
            <p className="max-w-[1000px] mx-auto text-gray-300 md:text-xl mt-6">
              Have questions about KickDeck? Our team is here to help you get started.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-full grid-cols-1 gap-8 py-16 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="rounded-lg border border-[#1a1e36] bg-[#0e1019] p-6">
            <h3 className="text-xl font-bold mb-6 text-white">Send Us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-300 leading-none">
                    Name
                  </label>
                  <Input 
                    id="name" 
                    placeholder="Enter your name" 
                    className="bg-[#131724] border-[#1a1e36] text-gray-300 placeholder:text-gray-500 focus:border-[#4d79ff] focus:ring-[#4d79ff]/20" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300 leading-none">
                    Email
                  </label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email" 
                    className="bg-[#131724] border-[#1a1e36] text-gray-300 placeholder:text-gray-500 focus:border-[#4d79ff] focus:ring-[#4d79ff]/20" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-gray-300 leading-none">
                  Subject
                </label>
                <Input 
                  id="subject" 
                  placeholder="Enter subject" 
                  className="bg-[#131724] border-[#1a1e36] text-gray-300 placeholder:text-gray-500 focus:border-[#4d79ff] focus:ring-[#4d79ff]/20" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-gray-300 leading-none">
                  Message
                </label>
                <Textarea 
                  id="message" 
                  placeholder="Enter your message" 
                  className="min-h-[150px] bg-[#131724] border-[#1a1e36] text-gray-300 placeholder:text-gray-500 focus:border-[#4d79ff] focus:ring-[#4d79ff]/20" 
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
              >
                Send Message
              </Button>
            </form>
          </div>
          
          {/* Contact Information */}
          <div className="rounded-lg border border-[#1a1e36] bg-[#0e1019] p-6">
            <h3 className="text-xl font-bold mb-6 text-white">Contact Information</h3>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-[#4d79ff]" />
                <div>
                  <h4 className="font-medium text-white">Email</h4>
                  <p className="text-sm text-gray-400">info@kickdeck.xyz</p>
                  <p className="text-sm text-gray-400">support@kickdeck.xyz</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-[#4d79ff]" />
                <div>
                  <h4 className="font-medium text-white">Phone</h4>
                  <p className="text-sm text-gray-400">+1 (555) 123-4567</p>
                  <p className="text-sm text-gray-400">Monday - Friday, 9AM - 5PM EST</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-[#4d79ff]" />
                <div>
                  <h4 className="font-medium text-white">Office</h4>
                  <p className="text-sm text-gray-400">
                    123 Soccer Way<br />
                    Suite 100<br />
                    Boston, MA 02110
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <h4 className="font-medium text-white mb-3">Follow Us</h4>
                <div className="flex space-x-4">
                  <a 
                    href="#" 
                    className="rounded-full bg-[#1a1e36] p-2 text-gray-300 hover:bg-[#4d79ff] hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="rounded-full bg-[#1a1e36] p-2 text-gray-300 hover:bg-[#4d79ff] hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="rounded-full bg-[#1a1e36] p-2 text-gray-300 hover:bg-[#4d79ff] hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="rounded-full bg-[#1a1e36] p-2 text-gray-300 hover:bg-[#4d79ff] hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingContact;