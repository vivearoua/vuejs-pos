import { useState, useEffect } from 'react';
import storeData from '../data/store.json';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PenTool as Tool, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';

type RepairStatus = 'all' | 'pending' | 'in-progress' | 'completed';

function RepairsContent() {
  const [filter, setFilter] = useState<RepairStatus>('all');
  const repairs = storeData.repairs;

  useEffect(() => {
    logger.info('Repairs page mounted', {
      totalRepairs: repairs.length,
      byStatus: repairs.reduce((acc, repair) => {
        const status = repair.status.toLowerCase().replace(' ', '-');
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
  }, [repairs.length]);

  const handleFilterChange = (newFilter: RepairStatus) => {
    try {
      logger.info('Repair filter changed', {
        previousFilter: filter,
        newFilter,
        resultsCount: repairs.filter(repair => {
          if (newFilter === 'all') return true;
          return repair.status.toLowerCase().replace(' ', '-') === newFilter;
        }).length
      });
      setFilter(newFilter);
    } catch (err) {
      logger.error('Error changing repair filter', err);
    }
  };

  const filteredRepairs = repairs.filter(repair => {
    if (filter === 'all') return true;
    return repair.status.toLowerCase().replace(' ', '-') === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" aria-label="En attente" />;
      case 'In Progress':
        return <Tool className="h-5 w-5 text-blue-500" aria-label="En cours" />;
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-500" aria-label="Terminé" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" aria-label="Statut inconnu" />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestion des Réparations</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => handleFilterChange('in-progress')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'in-progress'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Terminé
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 divide-y divide-gray-200">
          {filteredRepairs.map((repair) => (
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
                    Début: {format(new Date(repair.start_date), 'd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Problème</h4>
                  <p className="text-gray-900">{repair.issue}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Pièces utilisées</h4>
                  <p className="text-gray-900">{repair.parts_used.join(', ')}</p>
                </div>
              </div>

              {repair.estimated_completion && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    Date estimée de fin
                  </h4>
                  <p className="text-gray-900">
                    {format(new Date(repair.estimated_completion), 'd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              )}

              {repair.completed_date && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    Date de fin
                  </h4>
                  <p className="text-gray-900">
                    {format(new Date(repair.completed_date), 'd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Repairs() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-red-600 text-center">
            <h2 className="text-lg font-bold">Une erreur est survenue</h2>
            <p>Impossible de charger les réparations</p>
          </div>
        </div>
      }
    >
      <RepairsContent />
    </ErrorBoundary>
  );
}