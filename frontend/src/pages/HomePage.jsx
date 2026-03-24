import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  PackageIcon,
  UsersIcon,
  MapPinIcon,
  HeartHandshakeIcon,
  SparklesIcon,
  QuoteIcon,
  HeartIcon
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
      staggerChildren: 0.2
    }
  }
};

export function HomePage({ setPage }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-2xl"
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blush/30 text-ink-muted font-medium text-sm mb-6"
              >
                <SparklesIcon className="w-4 h-4 text-coral" />
                <span>Advancing Menstrual Equity</span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 text-balance"
              >
                Everyone Deserves{' '}
                <span className="text-coral italic">Dignity.</span> Period.
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-ink-muted mb-8 leading-relaxed max-w-lg"
              >
                We connect marginalized communities with free, high-quality
                menstrual products. Because access to basic health needs
                shouldn't be a privilege.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center gap-4"
              >
                <button
                  onClick={() => setPage('contact')}
                  className="bg-coral text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-coral-dark transition-colors shadow-soft flex items-center gap-2 group"
                >
                  Request Products
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setPage('about')}
                  className="bg-white text-ink px-8 py-4 rounded-full font-medium text-lg hover:bg-cream-dark transition-colors shadow-sm border border-blush/50"
                >
                  Learn More
                </button>
              </motion.div>
            </motion.div>

            {/* Hero Abstract Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blush via-coral/20 to-cream rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-[spin_20s_linear_infinite] opacity-70 blur-2xl"></div>

              <div className="absolute inset-4 bg-plum/5 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] overflow-hidden border-4 border-white/50 backdrop-blur-sm flex items-center justify-center shadow-soft-lg">
                <div className="text-center p-8">
                  <HeartHandshakeIcon className="w-24 h-24 text-coral mx-auto mb-4 opacity-80" />
                  <p className="font-heading text-2xl text-plum font-medium italic">
                    Community Care in Action
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-10 -left-6 md:left-10 bg-white p-4 rounded-2xl shadow-soft-lg flex items-center gap-4"
              >
                <div className="bg-blush/30 p-3 rounded-full text-coral">
                  <PackageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-xl text-ink">50k+</p>
                  <p className="text-sm text-ink-muted font-medium">
                    Products Distributed
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white rounded-t-4xl md:rounded-t-[4rem] relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              margin: '-100px'
            }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our Mission
            </h2>
            <p className="text-xl md:text-2xl text-ink-muted leading-relaxed font-body">
              PeriodPal bridges the gap between abundance and need. We believe
              that menstrual equity is a fundamental human right, and we're
              building a world where no one has to choose between food and
              menstrual products.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-ink-muted max-w-2xl mx-auto">
              A simple, dignified process to get products to those who need them
              most.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              margin: '-50px'
            }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
          >
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-blush/50 border-t-2 border-dashed border-blush z-0"></div>

            {[
              {
                icon: MapPinIcon,
                title: '1. Request',
                desc: 'Individuals or community centers submit a confidential request for specific products.'
              },
              {
                icon: HeartHandshakeIcon,
                title: '2. Match',
                desc: 'Our platform matches requests with local donors, partners, and our inventory.'
              },
              {
                icon: PackageIcon,
                title: '3. Receive',
                desc: 'Products are delivered discreetly and free of charge directly to the recipient.'
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-white rounded-3xl shadow-soft flex items-center justify-center mb-6 rotate-3 hover:rotate-0 transition-transform duration-300 border border-blush/20">
                  <step.icon className="w-10 h-10 text-coral" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-heading">
                  {step.title}
                </h3>
                <p className="text-ink-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-plum text-cream rounded-4xl md:rounded-[4rem] mx-4 sm:mx-6 lg:mx-8 my-12 px-4 sm:px-8 lg:px-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center"
        >
          {[
            {
              number: '50k+',
              label: 'Products Distributed'
            },
            {
              number: '120+',
              label: 'Community Partners'
            },
            {
              number: '15k',
              label: 'Individuals Reached'
            },
            {
              number: '100%',
              label: 'Free & Confidential'
            }
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="flex flex-col gap-2"
            >
              <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-blush font-heading">
                {stat.number}
              </span>
              <span className="text-sm md:text-base text-cream/80 font-medium uppercase tracking-wider">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Community Voices */}
      <section className="py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Community Voices
            </h2>
            <p className="text-lg text-ink-muted max-w-2xl mx-auto">
              Hear from the people and partners who make our mission possible.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                quote:
                  'PeriodPal has completely changed how our shelter supports residents. We no longer have to ration pads.',
                author: 'Sarah M.',
                role: 'Shelter Director'
              },
              {
                quote:
                  "As a student, I used to miss classes because I couldn't afford tampons. This service gave me my life back.",
                author: 'Elena R.',
                role: 'University Student'
              },
              {
                quote:
                  "Volunteering to deliver these packages is the most direct way I've found to impact my local community.",
                author: 'David K.',
                role: 'Volunteer Driver'
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white p-8 rounded-3xl shadow-soft relative"
              >
                <QuoteIcon className="w-10 h-10 text-blush/40 absolute top-6 right-6" />
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <HeartIcon
                      key={j}
                      className="w-4 h-4 text-coral fill-current"
                    />
                  ))}
                </div>
                <p className="text-lg text-ink mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-bold text-ink">{testimonial.author}</p>
                  <p className="text-sm text-ink-muted">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-coral/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Join the Movement
            </h2>
            <p className="text-xl text-ink-muted mb-10 max-w-2xl mx-auto">
              Whether you need products, want to donate, or are looking to
              partner with us, there's a place for you in our community.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => setPage('contact')}
                className="w-full sm:w-auto bg-coral text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-coral-dark transition-colors shadow-soft"
              >
                Get Involved Today
              </button>
              <button
                onClick={() => setPage('about')}
                className="w-full sm:w-auto bg-white text-ink px-8 py-4 rounded-full font-medium text-lg hover:bg-cream-dark transition-colors border border-coral/20"
              >
                Read Our Story
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}