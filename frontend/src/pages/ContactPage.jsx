import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  ChevronDownIcon,
  SendIcon
} from 'lucide-react';

const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};

const staggerContainer = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const faqs = [
  {
    question: 'Who is eligible to receive free products?',
    answer:
      'Anyone who needs them. We operate on a trust-based model and do not require proof of income or need. If you request products, we will do our best to provide them.'
  },
  {
    question: 'How are the products delivered?',
    answer:
      'Products are delivered in discreet, unbranded packaging directly to the address provided, or they can be picked up at one of our local community partner locations.'
  },
  {
    question: 'What types of products do you offer?',
    answer:
      'We offer a variety of products including pads, tampons, menstrual cups, and period underwear. Availability may vary based on current donations and inventory.'
  },
  {
    question: 'How can my organization partner with PeriodPal?',
    answer:
      "We're always looking for community partners! Please use the contact form on this page and select 'Partnership Inquiry' as the subject. Our team will reach out within 2 business days."
  }
];

export function ContactPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [formStatus, setFormStatus] = useState('idle');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('submitting');

    setTimeout(() => {
      setFormStatus('success');
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            Get In Touch
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-ink-muted max-w-2xl mx-auto"
          >
            Whether you need support, want to volunteer, or have a question,
            we're here to listen.
          </motion.p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            {/* Form Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl shadow-soft border border-blush/20"
            >
              <h2 className="text-2xl font-bold mb-6 font-heading">
                Send us a message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-ink mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white focus:ring-2 focus:ring-coral focus:border-transparent transition-all outline-none"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-ink mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white focus:ring-2 focus:ring-coral focus:border-transparent transition-all outline-none"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-ink mb-2"
                  >
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      id="subject"
                      className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white focus:ring-2 focus:ring-coral focus:border-transparent transition-all outline-none appearance-none"
                    >
                      <option>Requesting Products</option>
                      <option>Donation Inquiry</option>
                      <option>Partnership Inquiry</option>
                      <option>Volunteer Opportunities</option>
                      <option>Other</option>
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-ink mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/30 focus:bg-white focus:ring-2 focus:ring-coral focus:border-transparent transition-all outline-none resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={formStatus !== 'idle'}
                  className="w-full bg-coral text-white py-4 rounded-xl font-medium text-lg hover:bg-coral-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {formStatus === 'idle' && (
                    <>
                      <SendIcon className="w-5 h-5" /> Send Message
                    </>
                  )}
                  {formStatus === 'submitting' && 'Sending...'}
                  {formStatus === 'success' && 'Message Sent!'}
                </button>
              </form>
            </motion.div>

            {/* Info Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-5 space-y-8"
            >
              <motion.div
                variants={fadeInUp}
                className="bg-plum text-cream p-8 rounded-3xl shadow-soft-lg"
              >
                <h3 className="text-xl font-bold mb-6 font-heading text-white">
                  Contact Information
                </h3>

                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <div className="bg-white/10 p-3 rounded-full shrink-0">
                      <MailIcon className="w-6 h-6 text-blush" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Email</p>
                      <p className="text-cream/80">hello@periodpal.org</p>
                      <p className="text-sm text-cream/60 mt-1">
                        We aim to reply within 24 hours.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-4">
                    <div className="bg-white/10 p-3 rounded-full shrink-0">
                      <PhoneIcon className="w-6 h-6 text-blush" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Phone</p>
                      <p className="text-cream/80">1-800-PERIODS</p>
                      <p className="text-sm text-cream/60 mt-1">
                        Mon-Fri, 9am - 5pm EST
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-4">
                    <div className="bg-white/10 p-3 rounded-full shrink-0">
                      <MapPinIcon className="w-6 h-6 text-blush" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Headquarters</p>
                      <p className="text-cream/80">
                        123 Equity Ave, Suite 400
                        <br />
                        New York, NY 10001
                      </p>
                    </div>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="bg-cream-dark h-48 rounded-3xl border border-blush/30 overflow-hidden relative flex items-center justify-center"
              >
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <p className="text-ink-muted font-medium z-10 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5" /> View on Map
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-ink-muted">
              Find quick answers to common questions about our services.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-blush/30 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                  aria-expanded={openFaq === index}
                >
                  <span className="font-bold text-lg pr-8">{faq.question}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-coral shrink-0 transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-5 text-ink-muted leading-relaxed border-t border-cream-dark pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}