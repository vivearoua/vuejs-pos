import React, { useState } from 'react';
import storeData from '../data/store.json';
import { format } from 'date-fns';
import { Search, CreditCard, PenTool as Tool } from 'lucide-react';

function Transactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'sale' | 'repair'>('all');

  const transactions = storeData.transactions.filter(transaction => {
    const matchesSearch = transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filter === 'all' || transaction.type === filter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'sale' | 'repair')}
          >
            <option value="all">All Transactions</option>
            <option value="sale">Sales</option>
            <option value="repair">Repairs</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="p-6 border-b border-gray-200 last:border-0"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                {transaction.type === 'sale' ? (
                  <CreditCard className="h-8 w-8 text-green-500" />
                ) : (
                  <Tool className="h-8 w-8 text-blue-500" />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {transaction.customer_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(transaction.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ${transaction.total_amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">{transaction.payment_method}</p>
              </div>
            </div>

            {transaction.items && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
                <div className="space-y-2">
                  {transaction.items.map((item, index) => {
                    const itemDetails = item.item_type === 'phone'
                      ? storeData.phones.find(p => p.id === item.item_id)
                      : storeData.accessories.find(a => a.id === item.item_id);

                    return (
                      <div
                        key={index}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>
                          {item.item_type === 'phone'
                            ? `${itemDetails?.brand} ${itemDetails?.model}`
                            : itemDetails?.name}{' '}
                          x {item.quantity}
                        </span>
                        <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {transaction.repair_id && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Repair Details</h4>
                {storeData.repairs
                  .filter((repair) => repair.id === transaction.repair_id)
                  .map((repair) => (
                    <div key={repair.id} className="text-sm text-gray-600">
                      <p>{repair.issue}</p>
                      <p className="mt-1">Parts: {repair.parts_used.join(', ')}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Transactions;