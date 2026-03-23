import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classNames, formatDate } from '../utils/helpers';

const mockRequests = [
  {
    id: 'REQ-001',
    user: 'Sarah Johnson',
    items: ['Sanitary Pads (2 packs)', 'Pain Relief (1 strip)'],
    date: '2026-03-15',
    status: 'Pending',
    location: 'Community Center A'
  },
  {
    id: 'REQ-002',
    user: 'Maria Garcia',
    items: ['Menstrual Cup (Size S)'],
    date: '2026-03-10',
    status: 'Approved',
    location: 'Mobile Clinic B'
  },
  {
    id: 'REQ-003',
    user: 'Aisha Patel',
    items: ['Tampons (1 pack)'],
    date: '2026-03-01',
    status: 'Fulfilled',
    location: 'Community Center A'
  }
];

export function ProductRequests() {
  const { user } = useAuth();
  const isNgo = user?.role === 'ngo' || user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('All');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      case 'Approved':
        return 'bg-blue-100 text-blue-700';
      case 'Fulfilled':
        return 'bg-emerald-100 text-emerald-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'Approved':
      case 'Fulfilled':
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const filteredRequests =
    activeTab === 'All'
      ? mockRequests
      : mockRequests.filter((r) => r.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            Product Requests
          </h1>
          <p className="text-secondary-500 mt-1">
            {isNgo
              ? 'Manage and fulfill community product requests.'
              : 'Request free sanitary products from partner NGOs.'}
          </p>
        </div>

        {!isNgo && (
          <button className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/20">
            <Plus className="h-5 w-5" />
            New Request
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-secondary-100/50 p-1 rounded-xl w-full max-w-md mb-6">
        {['All', 'Pending', 'Approved', 'Fulfilled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={classNames(
              'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors',
              activeTab === tab
                ? 'bg-white text-secondary-900 shadow-sm'
                : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-200/50'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-100 text-secondary-500 text-sm">
                <th className="px-6 py-4 font-medium">Request ID</th>
                {isNgo && <th className="px-6 py-4 font-medium">User</th>}
                <th className="px-6 py-4 font-medium">Items Requested</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                {isNgo && (
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-secondary-100">
              {filteredRequests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:bg-secondary-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-secondary-900">
                        {request.id}
                      </span>
                    </div>
                  </td>

                  {isNgo && (
                    <td className="px-6 py-4 text-secondary-600">
                      {request.user}
                    </td>
                  )}

                  <td className="px-6 py-4">
                    {request.items.map((item, i) => (
                      <div key={i} className="text-sm text-secondary-700">
                        • {item}
                      </div>
                    ))}
                  </td>

                  <td className="px-6 py-4 text-secondary-600 text-sm">
                    {formatDate(request.date)}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={classNames(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        getStatusColor(request.status)
                      )}
                    >
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                  </td>

                  {isNgo && (
                    <td className="px-6 py-4 text-right">
                      {request.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                            Approve
                          </button>
                          <button className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                            Reject
                          </button>
                        </div>
                      )}

                      {request.status === 'Approved' && (
                        <button className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                          Mark Fulfilled
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {filteredRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={isNgo ? 6 : 4}
                    className="px-6 py-12 text-center text-secondary-500"
                  >
                    No requests found for this status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}