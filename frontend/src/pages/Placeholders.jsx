import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarHeart,
  Package,
  Warehouse,
  HeartHandshake
} from 'lucide-react';

const PlaceholderPage = ({ title, icon: Icon, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="h-full flex flex-col items-center justify-center text-center p-8"
  >
    <div className="h-20 w-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
      <Icon className="h-10 w-10 text-primary-500" />
    </div>

    <h1 className="text-3xl font-bold text-secondary-900 mb-3">
      {title}
    </h1>

    <p className="text-secondary-500 max-w-md mx-auto mb-8">
      {description}
    </p>

    <div className="inline-flex items-center px-4 py-2 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
      Coming Soon in Block 2
    </div>
  </motion.div>
);

export const MenstrualRecords = () => (
  <PlaceholderPage
    title="Menstrual Records"
    icon={CalendarHeart}
    description="Track your menstrual cycle, symptoms, and receive personalized health insights."
  />
);

export const ProductRequests = () => (
  <PlaceholderPage
    title="Product Requests"
    icon={Package}
    description="Request free sanitary products or manage incoming requests from the community."
  />
);

export const Inventory = () => (
  <PlaceholderPage
    title="Inventory Management"
    icon={Warehouse}
    description="Manage stock levels, track distributions, and monitor low-stock alerts."
  />
);

export const Donations = () => (
  <PlaceholderPage
    title="Donations"
    icon={HeartHandshake}
    description="Contribute funds or products to support menstrual equity in marginalized communities."
  />
);