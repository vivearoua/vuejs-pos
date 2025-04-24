import React, { useState } from 'react';
import { Client } from '../../services/clientService';
import ClientLoyalty from './ClientLoyalty';

interface ClientDetailsProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'loyalty'>('info');
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non disponible';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-start p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold">{client.name}</h2>
          <p className="text-gray-500">ID: {client.id}</p>
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

      <div className="border-b">
        <div className="flex">
          <button
            className={`px-6 py-3 ${activeTab === 'info' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
            onClick={() => setActiveTab('info')}
          >
            Informations
          </button>
          <button
            className={`px-6 py-3 ${activeTab === 'loyalty' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
            onClick={() => setActiveTab('loyalty')}
          >
            Programme de Fidélité
          </button>
        </div>
      </div>

      {activeTab === 'info' ? (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Informations de contact</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">Email:</span>{' '}
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="text-blue-500 hover:underline">
                      {client.email}
                    </a>
                  ) : (
                    <span className="text-gray-400">Non renseigné</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-600">Téléphone:</span>{' '}
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="text-blue-500 hover:underline">
                      {client.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400">Non renseigné</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-600">Adresse:</span>{' '}
                  {client.address || <span className="text-gray-400">Non renseignée</span>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Statistiques d'achat</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">Total des achats:</span>{' '}
                  <span className="font-semibold">
                    {client.total_purchases 
                      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.total_purchases)
                      : '0,00 €'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Dernier achat:</span>{' '}
                  {client.last_purchase_date 
                    ? formatDate(client.last_purchase_date)
                    : <span className="text-gray-400">Aucun achat</span>}
                </div>
                <div>
                  <span className="text-gray-600">Date d'inscription:</span>{' '}
                  {formatDate(client.registration_date)}
                </div>
              </div>
            </div>
          </div>

          {client.notes && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                {client.notes}
              </div>
            </div>
          )}
        </div>
      ) : (
        <ClientLoyalty client={client} />
      )}
    </div>
  );
};

export default ClientDetails;
