import React from 'react';
import { motion } from 'framer-motion';
import { Warehouse, Plus, AlertTriangle, Search, Filter } from 'lucide-react';
import { classNames } from '../utils/helpers';

const mockInventory = [
  {
    id: 'INV-001',
    name: 'Sanitary Pads (Regular)',
    category: 'Pads',
    quantity: 1250,
    unit: 'packs',
    status: 'In Stock',
    location: 'Main Warehouse'
  },
  {
    id: 'INV-002',
    name: 'Sanitary Pads (Overnight)',
    category: 'Pads',
    quantity: 45,
    unit: 'packs',
    status: 'Low Stock',
    location: 'Main Warehouse'
  },
  {
    id: 'INV-003',
    name: 'Menstrual Cups (Size S)',
    category: 'Cups',
    quantity: 0,
    unit: 'units',
    status: 'Out of Stock',
    location: 'Clinic B'
  },
  {
    id: 'INV-004',
    name: 'Tampons (Regular)',
    category: 'Tampons',
    quantity: 800,
    unit: 'boxes',
    status: 'In Stock',
    location: 'Main Warehouse'
  }
];

export function Inventory() {
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
            Inventory Management
          </h1>
          <p className="text-secondary-500 mt-1">
            Track and manage menstrual health supplies across locations.
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/20">
          <Plus className="h-5 w-5" />
          Add Item
        </button>
      </div>

      {/* Stats */}
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
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Warehouse className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                Total Items
              </p>
              <p className="text-2xl font-bold text-secondary-900">2,095</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-red-200 bg-red-50/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">
                Low/Out of Stock
              </p>
              <p className="text-2xl font-bold text-red-900">2 Alerts</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-secondary-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 shadow-sm"
          />
        </div>

        <button className="flex items-center justify-center gap-2 bg-white border border-secondary-200 text-secondary-700 py-2.5 px-4 rounded-xl font-medium hover:bg-secondary-50 transition-colors shadow-sm">
          <Filter className="h-5 w-5" />
          Filter
        </button>
      </div>

      {/* Inventory Table */}
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
          delay: 0.2
        }}
        className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-100 text-secondary-500 text-sm">
                <th className="px-6 py-4 font-medium">Item Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium text-right">Quantity</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-secondary-100">
              {mockInventory.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-secondary-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-secondary-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-secondary-500">{item.id}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-secondary-600 text-sm">
                    {item.category}
                  </td>

                  <td className="px-6 py-4 text-secondary-600 text-sm">
                    {item.location}
                  </td>

                  <td className="px-6 py-4 text-right font-medium text-secondary-900">
                    {item.quantity}{' '}
                    <span className="text-secondary-500 text-xs font-normal">
                      {item.unit}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={classNames(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        item.status === 'In Stock'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.status === 'Low Stock'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}