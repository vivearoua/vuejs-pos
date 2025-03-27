import React from 'react';
import { Repair, repairService } from '../../services/repairService';

interface RepairDetailsProps {
  repair: Repair;
  onEdit: () => void;
  onDelete: () => void;
}

const RepairDetails: React.FC<RepairDetailsProps> = ({ repair, onEdit, onDelete }) => {
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Non disponible';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      in_progress: 'En cours',
      waiting_parts: 'Attente pièces',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'text-yellow-600',
      in_progress: 'text-blue-600',
      waiting_parts: 'text-purple-600',
      completed: 'text-green-600',
      cancelled: 'text-red-600'
    };
    return statusColors[status] || 'text-gray-600';
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Repair['status'];
    if (window.confirm(`Changer le statut en "${getStatusLabel(newStatus)}" ?`)) {
      repairService.updateRepairStatus(repair.id, newStatus);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold">Réparation #{repair.id}</h2>
          <p className="text-gray-500">Client: {repair.customer_name}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Statut actuel</h3>
          <select
            value={repair.status}
            onChange={handleStatusChange}
            className={`p-2 border rounded-lg ${getStatusColor(repair.status)}`}
          >
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="waiting_parts">Attente pièces</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-3">Informations client</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Nom:</span>{' '}
              <span className="font-medium">{repair.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Téléphone:</span>{' '}
              {repair.customer_phone ? (
                <a href={`tel:${repair.customer_phone}`} className="text-blue-500 hover:underline">
                  {repair.customer_phone}
                </a>
              ) : (
                <span className="text-gray-400">Non renseigné</span>
              )}
            </div>
            <div>
              <span className="text-gray-600">ID Client:</span>{' '}
              <span>{repair.client_id || 'Non associé'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Détails de la réparation</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Date de début:</span>{' '}
              <span>{formatDate(repair.start_date)}</span>
            </div>
            <div>
              <span className="text-gray-600">Date estimée:</span>{' '}
              <span>{formatDate(repair.estimated_completion)}</span>
            </div>
            <div>
              <span className="text-gray-600">Date de fin:</span>{' '}
              <span>{formatDate(repair.completed_date)}</span>
            </div>
            <div>
              <span className="text-gray-600">Coût total:</span>{' '}
              <span className="font-semibold">{formatCurrency(repair.cost)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3">Problème signalé</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          {repair.issue}
        </div>
      </div>

      {repair.diagnosis && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Diagnostic</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            {repair.diagnosis}
          </div>
        </div>
      )}

      {repair.parts_used && repair.parts_used.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Pièces utilisées</h3>
          <ul className="list-disc list-inside p-4 bg-gray-50 rounded-lg">
            {repair.parts_used.map((part, index) => (
              <li key={index}>{part}</li>
            ))}
          </ul>
        </div>
      )}

      {repair.technician_notes && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Notes du technicien</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            {repair.technician_notes}
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-gray-600">Dernière mise à jour:</span>{' '}
            <span>{formatDate(repair.updated_at)}</span>
          </div>
          <div>
            <span className="text-gray-600">Main d'œuvre:</span>{' '}
            <span>{formatCurrency(repair.labor_cost || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairDetails;
