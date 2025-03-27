import React, { useState, useEffect } from 'react';
import { clientService, Client } from '../../services/clientService';
import ClientForm from './ClientForm';
import ClientList from './ClientList';
import ClientDetails from './ClientDetails';

const ClientPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, new30Days: 0 });

  useEffect(() => {
    loadClients();
    updateStats();

    const unsubscribe = clientService.subscribe((type) => {
      if (['client_added', 'client_updated', 'client_deleted'].includes(type)) {
        loadClients();
        updateStats();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadClients = () => {
    if (searchTerm) {
      setClients(clientService.searchClients(searchTerm));
    } else {
      setClients(clientService.getClients());
    }
  };

  const updateStats = () => {
    setStats(clientService.getClientStats());
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setClients(clientService.searchClients(e.target.value));
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setShowForm(false);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setShowForm(true);
    setEditMode(false);
  };

  const handleEditClient = () => {
    if (selectedClient) {
      setShowForm(true);
      setEditMode(true);
    }
  };

  const handleDeleteClient = () => {
    if (selectedClient && window.confirm(`Êtes-vous sûr de vouloir supprimer le client ${selectedClient.name}?`)) {
      clientService.deleteClient(selectedClient.id);
      setSelectedClient(null);
    }
  };

  const handleFormSubmit = (clientData: Omit<Client, 'id'> | Partial<Omit<Client, 'id'>>) => {
    if (editMode && selectedClient) {
      clientService.updateClient(selectedClient.id, clientData as Partial<Omit<Client, 'id'>>);
    } else {
      clientService.addClient(clientData as Omit<Client, 'id'>);
    }
    setShowForm(false);
  };

  const handleExportCSV = () => {
    const csvContent = clientService.exportClientsToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Clients</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleAddClient}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Ajouter un Client
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Exporter CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Total Clients</h2>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Clients Actifs</h2>
          <p className="text-3xl font-bold">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Nouveaux Clients (30j)</h2>
          <p className="text-3xl font-bold">{stats.new30Days}</p>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ClientList
            clients={clients}
            onSelectClient={handleSelectClient}
            selectedClientId={selectedClient?.id}
          />
        </div>
        <div className="lg:col-span-2">
          {showForm ? (
            <ClientForm
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
              initialData={editMode ? selectedClient : undefined}
            />
          ) : selectedClient ? (
            <ClientDetails
              client={selectedClient}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
            />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-500">Sélectionnez un client pour voir les détails ou ajoutez-en un nouveau</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
