import React, { useState } from 'react';
import storeData from '../data/store.json';
import { format } from 'date-fns';
import { PenTool as Tool, Clock, CheckCircle, AlertCircle } from 'lucide-react';

function Repairs() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const repairs = storeData.repairs;

  const filteredRepairs = repairs.filter(repair => {
    if (filter === 'all') return true;
    return repair.status.toLowerCase().replace(' ', '-') === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'In Progress':
        return <Tool className="h-5 w-5 text-blue-500" />;
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Repair Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'in-progress'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 divide-y divide-gray-200">
          {filteredRepairs.map((repair) => {
            const phone = storeData.phones.find(p => p.phone_id === repair.phone_id);
            return (
              <div key={repair.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(repair.status)}
                      <h3 className="text-lg font-medium text-gray-900">
                        {repair.customer_name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{repair.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${repair.cost.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Started: {format(new Date(repair.start_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Issue</h4>
                    <p className="text-gray-900">{repair.issue}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Parts Used</h4>
                    <p className="text-gray-900">{repair.parts_used.join(', ')}</p>
                  </div>
                </div>

                {repair.estimated_completion && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      Estimated Completion
                    </h4>
                    <p className="text-gray-900">
                      {format(new Date(repair.estimated_completion), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}

                {repair.completed_date && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      Completed Date
                    </h4>
                    <p className="text-gray-900">
                      {format(new Date(repair.completed_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Repairs;