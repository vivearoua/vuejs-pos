import React, { useState, useEffect } from 'react';
import { repairService, Repair, RepairFilter } from '../../services/repairService';
import RepairList from './RepairList';
import RepairDetails from './RepairDetails';
import RepairForm from './RepairForm';
import { clientService } from '../../services/clientService';

const RepairPage: React.FC = () => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [isAddingRepair, setIsAddingRepair] = useState(false);
  const [isEditingRepair, setIsEditingRepair] = useState(false);
  const [filters, setFilters] = useState<RepairFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    averageCompletionTime: 0
  });

  useEffect(() => {
    loadRepairs();
    updateStats();

    // S'abonner aux mises à jour du service de réparations
    const unsubscribe = repairService.subscribe((type, _) => {
      if (['repair_added', 'repair_updated', 'repair_deleted'].includes(type)) {
        loadRepairs();
        updateStats();
      }
    });

    return () => unsubscribe();
  }, [filters]);

  const loadRepairs = () => {
    const repairsList = repairService.getRepairs({
      ...filters,
      searchTerm: searchTerm
    });
    setRepairs(repairsList);
  };

  const updateStats = () => {
    setStats(repairService.getRepairStats());
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, searchTerm: value }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value === 'all' ? undefined : value }));
  };

  const handleSelectRepair = (repair: Repair) => {
    setSelectedRepair(repair);
    setIsAddingRepair(false);
    setIsEditingRepair(false);
  };

  const handleAddRepair = () => {
    setSelectedRepair(null);
    setIsAddingRepair(true);
    setIsEditingRepair(false);
  };

  const handleEditRepair = () => {
    setIsEditingRepair(true);
    setIsAddingRepair(false);
  };

  const handleDeleteRepair = () => {
    if (selectedRepair && window.confirm('Êtes-vous sûr de vouloir supprimer cette réparation ?')) {
      repairService.deleteRepair(selectedRepair.id);
      setSelectedRepair(null);
    }
  };

  const handleSubmitRepair = (repairData: any) => {
    if (isEditingRepair && selectedRepair) {
      repairService.updateRepair(selectedRepair.id, repairData);
      const updatedRepair = repairService.getRepairById(selectedRepair.id);
      setSelectedRepair(updatedRepair || null);
      setIsEditingRepair(false);
    } else {
      const newRepair = repairService.addRepair(repairData);
      setSelectedRepair(newRepair);
      setIsAddingRepair(false);
    }
  };

  const handleCancel = () => {
    setIsAddingRepair(false);
    setIsEditingRepair(false);
  };

  const handleExportCSV = () => {
    const csvContent = repairService.exportRepairsToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `repairs_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Réparations</h1>
        <button
          onClick={handleAddRepair}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Nouvelle Réparation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Total des Réparations</h3>
          <p className="text-2xl">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">En Attente</h3>
          <p className="text-2xl text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">En Cours</h3>
          <p className="text-2xl text-blue-500">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Terminées</h3>
          <p className="text-2xl text-green-500">{stats.completed}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="w-full md:w-1/3">
          <div className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full p-2 border rounded-lg"
              />
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                title="Exporter en CSV"
              >
                <span>📊</span>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <select
              name="status"
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-lg"
              value={filters.status || 'all'}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="waiting_parts">Attente pièces</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <RepairList
            repairs={repairs}
            onSelectRepair={handleSelectRepair}
            selectedRepairId={selectedRepair?.id}
          />
        </div>

        <div className="w-full md:w-2/3">
          {isAddingRepair ? (
            <RepairForm onSubmit={handleSubmitRepair} onCancel={handleCancel} />
          ) : isEditingRepair && selectedRepair ? (
            <RepairForm
              onSubmit={handleSubmitRepair}
              onCancel={handleCancel}
              initialData={selectedRepair}
            />
          ) : selectedRepair ? (
            <RepairDetails
              repair={selectedRepair}
              onEdit={handleEditRepair}
              onDelete={handleDeleteRepair}
            />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-center text-gray-500">
                Sélectionnez une réparation ou créez-en une nouvelle
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepairPage;
