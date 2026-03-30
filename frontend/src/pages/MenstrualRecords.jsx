import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Droplet, Activity, Clock } from 'lucide-react';
import { classNames, formatDate } from '../utils/helpers';

// Mock Data
const mockRecords = [
  {
    id: '1',
    startDate: '2026-03-01',
    endDate: '2026-03-05',
    flow: 'Medium',
    symptoms: ['Cramps', 'Fatigue']
  },
  {
    id: '2',
    startDate: '2026-02-02',
    endDate: '2026-02-07',
    flow: 'Heavy',
    symptoms: ['Headache', 'Bloating', 'Cramps']
  },
  {
    id: '3',
    startDate: '2026-01-05',
    endDate: '2026-01-09',
    flow: 'Light',
    symptoms: ['Mood swings']
  }
];

export function MenstrualRecords() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            Menstrual Records
          </h1>
          <p className="text-secondary-500 mt-1">
            Track your cycle and monitor your health patterns.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/20"
        >
          <Plus className="h-5 w-5" />
          Log Period
        </button>
      </div>

      {/* Stats Overview */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                Average Cycle Length
              </p>
              <p className="text-2xl font-bold text-secondary-900">28 Days</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                Average Period Length
              </p>
              <p className="text-2xl font-bold text-secondary-900">5 Days</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                Next Predicted
              </p>
              <p className="text-2xl font-bold text-secondary-900">Mar 29</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* History List */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.3,
          duration: 0.5
        }}
        className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-secondary-100">
          <h2 className="text-lg font-bold text-secondary-900">
            Cycle History
          </h2>
        </div>

        <div className="divide-y divide-secondary-100">
          {mockRecords.map((record) => (
            <div
              key={record.id}
              className="p-6 hover:bg-secondary-50 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-full bg-primary-100 text-primary-600">
                    <Droplet className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-secondary-900">
                      {formatDate(record.startDate)} - {formatDate(record.endDate)}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={classNames(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium',
                          record.flow === 'Heavy'
                            ? 'bg-red-100 text-red-700'
                            : record.flow === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        )}
                      >
                        {record.flow} Flow
                      </span>

                      {record.symptoms.map((symptom, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-xs font-medium"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button className="text-sm font-medium text-primary-600 hover:text-primary-700 self-start md:self-center">
                  Edit Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Simple Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/50 backdrop-blur-sm">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-secondary-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary-900">
                Log Period
              </h3>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full border-secondary-200 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Flow Intensity
                </label>
                <select className="w-full border-secondary-200 rounded-xl focus:ring-primary-500 focus:border-primary-500">
                  <option>Light</option>
                  <option>Medium</option>
                  <option>Heavy</option>
                </select>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium mt-4 hover:bg-primary-700"
              >
                Save Record
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}