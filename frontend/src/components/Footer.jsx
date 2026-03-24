import React from 'react';
import { HeartIcon, InstagramIcon, TwitterIcon, MailIcon } from 'lucide-react';

export function Footer({ setPage }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-cream pt-16 pb-8 rounded-t-4xl md:rounded-t-[4rem] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          
          {/* Brand & Mission */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-coral text-white p-2 rounded-xl">
                <HeartIcon className="w-5 h-5 fill-current" />
              </div>
              <span className="font-heading font-bold text-2xl tracking-tight text-white">
                PeriodPal<span className="text-coral">.</span>
              </span>
            </div>

            <p className="text-cream-dark/80 text-lg mb-8 max-w-md leading-relaxed">
              Connecting marginalized communities with free menstrual products.
              Because everyone deserves dignity, period.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-coral transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>

              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-coral transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon className="w-5 h-5" />
              </a>

              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-coral transition-colors"
                aria-label="Email"
              >
                <MailIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 md:col-start-7">
            <h3 className="font-heading text-xl font-semibold mb-6 text-white">
              Explore
            </h3>

            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => setPage('home')}
                  className="text-cream-dark/80 hover:text-coral transition-colors"
                >
                  Home
                </button>
              </li>

              <li>
                <button
                  onClick={() => setPage('about')}
                  className="text-cream-dark/80 hover:text-coral transition-colors"
                >
                  Our Story
                </button>
              </li>

              <li>
                <button
                  onClick={() => setPage('contact')}
                  className="text-cream-dark/80 hover:text-coral transition-colors"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <h3 className="font-heading text-xl font-semibold mb-6 text-white">
              Get in Touch
            </h3>

            <ul className="space-y-4 text-cream-dark/80">
              <li>hello@periodpal.org</li>
              <li>1-800-PERIODS</li>

              <li className="pt-4">
                <button
                  onClick={() => setPage('contact')}
                  className="text-coral font-medium hover:text-white transition-colors flex items-center gap-2"
                >
                  Partner with us <span aria-hidden="true">→</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-cream-dark/60">
          <p>© {currentYear} PeriodPal. All rights reserved.</p>

          <div className="flex gap-6">
            <a href="#" className="hover:text-cream transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-cream transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}