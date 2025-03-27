import React from 'react';
import { Repair } from '../../services/repairService';

interface RepairListProps {
  repairs: Repair[];
  onSelectRepair: (repair: Repair) => void;
  selectedRepairId?: string;
}

const RepairList: React.FC<RepairListProps> = ({ repairs, onSelectRepair, selectedRepairId }) => {
  if (repairs.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-center text-gray-500">Aucune réparation trouvée</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_parts: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      in_progress: 'En cours',
      waiting_parts: 'Attente pièces',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };

    const className = `px-2 py-1 text-xs rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`;
    return (
      <span className={className}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="max-h-[600px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {repairs.map((repair) => (
              <tr 
                key={repair.id}
                onClick={() => onSelectRepair(repair)}
                className={`cursor-pointer hover:bg-gray-50 ${selectedRepairId === repair.id ? 'bg-blue-50' : ''}`}
              >
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{repair.id}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{repair.customer_name}</div>
                  <div className="text-sm text-gray-500">{repair.customer_phone || '-'}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {getStatusBadge(repair.status)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(repair.start_date)}</div>
                  {repair.status === 'completed' && repair.completed_date && (
                    <div className="text-sm text-gray-500">Fin: {formatDate(repair.completed_date)}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepairList;
