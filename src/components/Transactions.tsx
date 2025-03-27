import { useState, useEffect } from 'react';
import storeData from '../data/store.json';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, CreditCard, PenTool as Tool } from 'lucide-react';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';

type TransactionType = 'all' | 'sale' | 'repair';

function TransactionsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<TransactionType>('all');

  useEffect(() => {
    logger.info('Transactions page mounted', {
      totalTransactions: storeData.transactions.length,
      byType: storeData.transactions.reduce((acc, transaction) => {
        acc[transaction.type] = (acc[transaction.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalAmount: storeData.transactions.reduce((sum, t) => sum + t.total_amount, 0)
    });
  }, []);

  const handleSearch = (term: string) => {
    try {
      setSearchTerm(term);
      logger.info('Transaction search performed', {
        searchTerm: term,
        resultsCount: storeData.transactions.filter(t => 
          t.customer_name.toLowerCase().includes(term.toLowerCase())).length
      });
    } catch (err) {
      logger.error('Error during transaction search', err);
    }
  };

  const handleFilterChange = (newFilter: TransactionType) => {
    try {
      logger.info('Transaction filter changed', {
        previousFilter: filter,
        newFilter,
        resultsCount: storeData.transactions.filter(t => 
          newFilter === 'all' || t.type === newFilter).length
      });
      setFilter(newFilter);
    } catch (err) {
      logger.error('Error changing transaction filter', err);
    }
  };

  const transactions = storeData.transactions.filter(transaction => {
    const matchesSearch = transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filter === 'all' || transaction.type === filter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Historique des Transactions</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par client..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value as TransactionType)}
          >
            <option value="all">Toutes les transactions</option>
            <option value="sale">Ventes</option>
            <option value="repair">Réparations</option>
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
                  <CreditCard className="h-8 w-8 text-green-500" aria-label="Vente" />
                ) : (
                  <Tool className="h-8 w-8 text-blue-500" aria-label="Réparation" />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {transaction.customer_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(transaction.timestamp), 'd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ${transaction.total_amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {transaction.payment_method === 'credit_card' ? 'Carte bancaire' : 'Espèces'}
                </p>
              </div>
            </div>

            {transaction.items && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Articles</h4>
                <div className="space-y-2">
                  {transaction.items.map((item, index) => {
                    const itemDetails = item.item_type === 'phone'
                      ? storeData.phones.find(p => p.id === item.item_id)
                      : storeData.accessories.find(a => a.id === item.item_id);

                    let displayName = '';
                    if (item.item_type === 'phone' && itemDetails) {
                      const phone = itemDetails as typeof storeData.phones[0];
                      displayName = `${phone.brand} ${phone.model}`;
                    } else if (itemDetails) {
                      const accessory = itemDetails as typeof storeData.accessories[0];
                      displayName = accessory.name;
                    }

                    return (
                      <div
                        key={index}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>
                          {displayName} x {item.quantity}
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Détails de la réparation</h4>
                {storeData.repairs
                  .filter((repair) => repair.id === transaction.repair_id)
                  .map((repair) => (
                    <div key={repair.id} className="text-sm text-gray-600">
                      <p>{repair.issue}</p>
                      <p className="mt-1">Pièces : {repair.parts_used.join(', ')}</p>
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

export default function Transactions() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-red-600 text-center">
            <h2 className="text-lg font-bold">Une erreur est survenue</h2>
            <p>Impossible de charger les transactions</p>
          </div>
        </div>
      }
    >
      <TransactionsContent />
    </ErrorBoundary>
  );
}