import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldIcon,
  UnlockIcon,
  GlobeIcon,
  ZapIcon,
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
      staggerChildren: 0.15
    }
  }
};

export function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-blush/20 rounded-b-4xl md:rounded-b-[4rem]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Our Story
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-ink-muted leading-relaxed"
            >
              PeriodPal started with a simple observation: menstrual products
              are a necessity, not a luxury. Yet, millions struggle to afford
              them. We set out to change that narrative.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* What is Menstrual Equity */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="order-2 lg:order-1"
            >
              <div className="aspect-square bg-cream-dark rounded-[3rem] p-8 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-coral/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-plum/10 rounded-full blur-3xl"></div>

                <h3 className="text-3xl font-heading font-bold text-plum mb-6 relative z-10">
                  "Menstrual equity refers to the affordability, accessibility,
                  and safety of menstrual products."
                </h3>

                <p className="text-ink-muted font-medium relative z-10">
                  — It's about systemic change.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="order-1 lg:order-2"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold mb-6"
              >
                What is Menstrual Equity?
              </motion.h2>

              <motion.div
                variants={fadeInUp}
                className="space-y-6 text-lg text-ink-muted leading-relaxed"
              >
                <p>
                  Menstrual equity goes beyond simply handing out pads and
                  tampons. It's the belief that no one should be held back from
                  school, work, or participating in society because of a natural
                  bodily function.
                </p>

                <p>
                  Currently, many government assistance programs do not cover
                  menstrual products. They are often taxed as "luxury items,"
                  creating an unfair financial burden on those who menstruate,
                  particularly in marginalized communities.
                </p>

                <p>
                  PeriodPal exists to dismantle these barriers. We provide
                  immediate relief through product distribution while advocating
                  for long-term policy changes.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-ink-muted max-w-2xl mx-auto">
              The principles that guide every decision we make and every package
              we deliver.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {[
              {
                icon: ShieldIcon,
                title: 'Dignity First',
                desc: 'We believe in providing high-quality products discreetly. No questions asked, no proof of need required. Just support.'
              },
              {
                icon: UnlockIcon,
                title: 'Unrestricted Access',
                desc: 'We work to remove all barriers—financial, geographical, and social—that prevent people from accessing what they need.'
              },
              {
                icon: GlobeIcon,
                title: 'Community-Led',
                desc: 'We partner with local organizations who understand their neighborhoods best, ensuring our support is culturally competent and relevant.'
              },
              {
                icon: ZapIcon,
                title: 'Empowerment',
                desc: 'By removing the stress of period poverty, we empower individuals to focus on their education, careers, and well-being.'
              }
            ].map((value, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white p-8 md:p-10 rounded-3xl shadow-sm hover:shadow-soft transition-shadow duration-300 border border-blush/20"
              >
                <div className="w-14 h-14 bg-blush/30 rounded-2xl flex items-center justify-center mb-6 text-coral">
                  <value.icon className="w-7 h-7" />
                </div>

                <h3 className="text-2xl font-bold mb-4 font-heading">
                  {value.title}
                </h3>

                <p className="text-ink-muted leading-relaxed">
                  {value.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* Partners */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-12">
              Supported By Our Community Partners
            </h2>

            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 font-heading text-2xl font-bold">
                <HeartIcon className="w-8 h-8" /> Local Shelter
              </div>

              <div className="flex items-center gap-2 font-heading text-2xl font-bold">
                <HeartIcon className="w-8 h-8" /> City Schools
              </div>

              <div className="flex items-center gap-2 font-heading text-2xl font-bold">
                <HeartIcon className="w-8 h-8" /> Health Clinic
              </div>

              <div className="flex items-center gap-2 font-heading text-2xl font-bold">
                <HeartIcon className="w-8 h-8" /> Youth Center
              </div>
            </div>
          </motion.div>

        </div>
      </section>
    </motion.div>
  );
}