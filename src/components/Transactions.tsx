import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, CreditCard, PenTool as Tool, Calendar, Filter } from 'lucide-react';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';
import { clientService } from '../services/clientService';
// import { transactionService } from '../services/transactionService';

type TransactionType = 'all' | 'sale' | 'repair';
type DateFilterType = 'current_month' | 'previous_month' | 'current_year' | 'all_time';

function TransactionsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<TransactionType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('current_month');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);

  const [transactions, setTransactions] = useState<any[]>([]);

  // Charger les transactions et les clients
  useEffect(() => {
    // Charger les clients pour le filtre
    const loadedClients = clientService.getClients();
    setClients([{ id: 'all', name: 'Tous les clients' }, ...loadedClients]);
    
    // Charger les transactions
    const fetchTransactions = async () => {
      try {
        // Essayer d'abord de charger depuis l'API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/transactions`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        } else {
          // En cas d'échec, utiliser les données locales
          console.warn('Impossible de charger les transactions depuis l\'API, utilisation des données locales');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des transactions:', error);
      }
    };
    
    fetchTransactions();
    
    logger.info('Transactions page mounted', {
      dateFilter: dateFilter
    });
  }, []);
  
  // Journaliser les informations sur les transactions lorsqu'elles sont chargées
  useEffect(() => {
    if (transactions.length > 0) {
      logger.info('Transactions loaded', {
        totalTransactions: transactions.length,
        byType: transactions.reduce((acc, transaction) => {
          acc[transaction.type] = (acc[transaction.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalAmount: transactions.reduce((sum, t: any) => sum + t.total_amount, 0)
      });
    }
  }, [transactions]);

  const handleSearch = (term: string) => {
    try {
      setSearchTerm(term);
      logger.info('Transaction search performed', {
        searchTerm: term,
        resultsCount: transactions.filter((t: any) => 
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
        resultsCount: transactions.filter((t: any) => 
          newFilter === 'all' || t.type === newFilter).length
      });
      setFilter(newFilter);
    } catch (err) {
      logger.error('Error changing transaction filter', err);
    }
  };

  const handleDateFilterChange = (newDateFilter: DateFilterType) => {
    try {
      logger.info('Date filter changed', {
        previousFilter: dateFilter,
        newDateFilter
      });
      setDateFilter(newDateFilter);
    } catch (err) {
      logger.error('Error changing date filter', err);
    }
  };

  const handleClientFilterChange = (clientId: string) => {
    try {
      logger.info('Client filter changed', {
        previousClientId: selectedClientId,
        newClientId: clientId
      });
      setSelectedClientId(clientId);
    } catch (err) {
      logger.error('Error changing client filter', err);
    }
  };

  // Fonction pour obtenir les dates de début et de fin selon le filtre de date
  const getDateRange = () => {
    const now = new Date();
    
    switch (dateFilter) {
      case 'current_month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'previous_month':
        const prevMonth = subMonths(now, 1);
        return {
          start: startOfMonth(prevMonth),
          end: endOfMonth(prevMonth)
        };
      case 'current_year':
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        };
      case 'all_time':
      default:
        return {
          start: new Date(0), // Date minimale
          end: new Date(8640000000000000) // Date maximale
        };
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Filtre par terme de recherche
    const matchesSearch = transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par type de transaction
    const matchesType = filter === 'all' || transaction.type === filter;
    
    // Filtre par client
    const matchesClient = selectedClientId === 'all' || transaction.client_id === selectedClientId;
    
    // Filtre par date
    const transactionDate = new Date(transaction.timestamp);
    const dateRange = getDateRange();
    const matchesDate = transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    
    return matchesSearch && matchesType && matchesClient && matchesDate;
  });

  return (
    <div>
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
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
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Calendar size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Période :</span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleDateFilterChange('current_month')}
              className={`px-3 py-1.5 text-sm rounded-md ${dateFilter === 'current_month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Mois en cours
            </button>
            <button
              onClick={() => handleDateFilterChange('previous_month')}
              className={`px-3 py-1.5 text-sm rounded-md ${dateFilter === 'previous_month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Mois précédent
            </button>
            <button
              onClick={() => handleDateFilterChange('current_year')}
              className={`px-3 py-1.5 text-sm rounded-md ${dateFilter === 'current_year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Année en cours
            </button>
            <button
              onClick={() => handleDateFilterChange('all_time')}
              className={`px-3 py-1.5 text-sm rounded-md ${dateFilter === 'all_time' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Toutes les transactions
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Client :</span>
          </div>
          
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            value={selectedClientId}
            onChange={(e) => handleClientFilterChange(e.target.value)}
          >
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            {filteredTransactions.length} transaction(s) trouvée(s)
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredTransactions.map((transaction) => (
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
                  {transaction.items.map((item: any, index: number) => {
                    // Utiliser le nom directement s'il est disponible dans l'item
                    let displayName = item.name || `Article #${item.item_id}`;

                    // Si le nom n'est pas disponible, essayer de le construire à partir des informations disponibles
                    if (!item.name && item.item_type === 'phone') {
                      displayName = `Téléphone #${item.item_id}`;
                    } else if (!item.name && item.item_type === 'accessory') {
                      displayName = `Accessoire #${item.item_id}`;
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
                {/* Afficher les informations de réparation disponibles dans la transaction */}
                <div className="text-sm text-gray-600">
                  <p>ID de réparation: {transaction.repair_id}</p>
                </div>
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