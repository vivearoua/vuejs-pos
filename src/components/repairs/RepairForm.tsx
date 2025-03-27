import React, { useState, useEffect } from 'react';
import { Repair, RepairPart, repairService } from '../../services/repairService';
import { clientService, Client } from '../../services/clientService';

interface RepairFormProps {
  onSubmit: (repair: Omit<Repair, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: Repair | null;
}

const RepairForm: React.FC<RepairFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [parts, setParts] = useState<RepairPart[]>([]);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<any>({
    client_id: '',
    customer_name: '',
    customer_phone: '',
    issue: '',
    diagnosis: '',
    cost: 0,
    parts_used: [],
    labor_cost: 0,
    status: 'pending',
    technician_notes: '',
    start_date: new Date().toISOString().split('T')[0],
    estimated_completion: '',
  });

  useEffect(() => {
    // Charger les clients
    const clientsList = clientService.getClients();
    setClients(clientsList);

    // Charger les pièces
    const partsList = repairService.getParts();
    setParts(partsList);

    if (initialData) {
      // Convertir les dates au format YYYY-MM-DD pour les inputs date
      const formattedData = {
        ...initialData,
        start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
        estimated_completion: initialData.estimated_completion ? initialData.estimated_completion.split('T')[0] : '',
        completed_date: initialData.completed_date ? initialData.completed_date.split('T')[0] : '',
      };
      
      setFormData(formattedData);
      setSelectedParts(initialData.parts_used || []);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    if (clientId) {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          client_id: clientId,
          customer_name: selectedClient.name,
          customer_phone: selectedClient.phone || ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        client_id: '',
      }));
    }
  };

  const handlePartSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const partId = e.target.value;
    if (partId && !selectedParts.includes(partId)) {
      const selectedPart = parts.find(p => p.id === partId);
      if (selectedPart) {
        const newSelectedParts = [...selectedParts, partId];
        setSelectedParts(newSelectedParts);
        
        // Mettre à jour le coût total
        const partsCost = parts
          .filter(p => newSelectedParts.includes(p.id))
          .reduce((sum, p) => sum + p.cost, 0);
        
        setFormData(prev => ({
          ...prev,
          parts_used: newSelectedParts,
          cost: partsCost + (prev.labor_cost || 0)
        }));
      }
    }
  };

  const handleRemovePart = (partId: string) => {
    const newSelectedParts = selectedParts.filter(id => id !== partId);
    setSelectedParts(newSelectedParts);
    
    // Mettre à jour le coût total
    const partsCost = parts
      .filter(p => newSelectedParts.includes(p.id))
      .reduce((sum, p) => sum + p.cost, 0);
    
    setFormData(prev => ({
      ...prev,
      parts_used: newSelectedParts,
      cost: partsCost + (prev.labor_cost || 0)
    }));
  };

  const handleLaborCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const laborCost = parseFloat(e.target.value) || 0;
    
    // Mettre à jour le coût total
    const partsCost = parts
      .filter(p => selectedParts.includes(p.id))
      .reduce((sum, p) => sum + p.cost, 0);
    
    setFormData(prev => ({
      ...prev,
      labor_cost: laborCost,
      cost: partsCost + laborCost
    }));
  };

  const handleSearchClient = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // S'assurer que les dates sont au format ISO
    const formattedData = {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
      estimated_completion: formData.estimated_completion ? new Date(formData.estimated_completion).toISOString() : undefined,
      completed_date: formData.completed_date ? new Date(formData.completed_date).toISOString() : undefined,
    };
    
    onSubmit(formattedData);
  };

  const isEditMode = !!initialData;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        {isEditMode ? 'Modifier la Réparation' : 'Nouvelle Réparation'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold mb-3">Informations Client</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rechercher un client
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchClient}
                placeholder="Nom ou téléphone"
                className="w-full p-2 border rounded-lg"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client existant
              </label>
              <select
                onChange={handleClientSelect}
                value={formData.client_id || ''}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Sélectionner un client</option>
                {filteredClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.phone ? `(${client.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du client*
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                name="customer_phone"
                value={formData.customer_phone || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Détails de la Réparation</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problème signalé*
              </label>
              <textarea
                name="issue"
                value={formData.issue || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
                rows={3}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnostic
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date estimée de fin
                </label>
                <input
                  type="date"
                  name="estimated_completion"
                  value={formData.estimated_completion || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                name="status"
                value={formData.status || 'pending'}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="pending">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="waiting_parts">Attente pièces</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Pièces et Coûts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ajouter une pièce
              </label>
              <select
                onChange={handlePartSelect}
                value=""
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Sélectionner une pièce</option>
                {parts.map(part => (
                  <option key={part.id} value={part.id}>
                    {part.name} - {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(part.cost)}
                  </option>
                ))}
              </select>
              
              {selectedParts.length > 0 && (
                <div className="mt-3 p-3 border rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Pièces sélectionnées:</h4>
                  <ul className="space-y-1">
                    {selectedParts.map(partId => {
                      const part = parts.find(p => p.id === partId);
                      return part ? (
                        <li key={partId} className="flex justify-between items-center text-sm">
                          <span>{part.name} - {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(part.cost)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(partId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </div>
            
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coût de main d'œuvre
                </label>
                <div className="flex items-center">
                  <span className="mr-2">€</span>
                  <input
                    type="number"
                    name="labor_cost"
                    value={formData.labor_cost || 0}
                    onChange={handleLaborCostChange}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coût total
                </label>
                <div className="p-2 bg-gray-100 rounded-lg font-semibold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(formData.cost || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes du technicien
          </label>
          <textarea
            name="technician_notes"
            value={formData.technician_notes || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
            rows={3}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {isEditMode ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RepairForm;
