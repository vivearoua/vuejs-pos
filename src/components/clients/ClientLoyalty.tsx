import React, { useState, useEffect } from 'react';
import { Client, clientService } from '../../services/clientService';

interface ClientLoyaltyProps {
  client: Client;
}

const ClientLoyalty: React.FC<ClientLoyaltyProps> = ({ client }) => {
  const [addPoints, setAddPoints] = useState<number | null>(null);
  const [addDescription, setAddDescription] = useState('');
  const [redeemPoints, setRedeemPoints] = useState<number | null>(null);
  const [redeemDescription, setRedeemDescription] = useState('');
  const [levelBenefits, setLevelBenefits] = useState<{ discount: number, benefits: string[] }>({ discount: 0, benefits: [] });

  useEffect(() => {
    if (client) {
      setLevelBenefits(clientService.getLoyaltyLevelBenefits(client.loyalty_level));
    }
  }, [client]);

  const handleAddPoints = async () => {
    if (!client || !addPoints || addPoints <= 0) return;
    
    try {
      await clientService.addLoyaltyPoints(
        client.id,
        addPoints,
        addDescription || 'Ajout manuel de points'
      );
      
      // Réinitialiser les champs
      setAddPoints(null);
      setAddDescription('');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de points:', error);
    }
  };

  const handleRedeemPoints = async () => {
    if (!client || !redeemPoints || redeemPoints <= 0 || redeemPoints > client.loyalty_points) return;
    
    try {
      await clientService.redeemLoyaltyPoints(
        client.id,
        redeemPoints,
        redeemDescription || 'Utilisation manuelle de points'
      );
      
      // Réinitialiser les champs
      setRedeemPoints(null);
      setRedeemDescription('');
    } catch (error) {
      console.error('Erreur lors de l\'utilisation de points:', error);
    }
  };

  const getLevelName = (level: string): string => {
    switch (level) {
      case 'standard': return 'Standard';
      case 'silver': return 'Silver';
      case 'gold': return 'Gold';
      case 'platinum': return 'Platinum';
      default: return 'Standard';
    }
  };

  const getNextLevelName = (level: string): string => {
    switch (level) {
      case 'standard': return 'Silver';
      case 'silver': return 'Gold';
      case 'gold': return 'Platinum';
      default: return '';
    }
  };

  const getNextLevelPoints = (level: string): number => {
    switch (level) {
      case 'standard': return 200; // Points pour Silver
      case 'silver': return 400;   // Points pour Gold
      case 'gold': return 750;     // Points pour Platinum
      default: return 0;
    }
  };

  const getHistoryTypeLabel = (type: string): string => {
    switch (type) {
      case 'earn': return 'Gain';
      case 'redeem': return 'Utilisation';
      case 'level_change': return 'Changement de niveau';
      default: return type;
    }
  };

  const getHistoryItemClass = (type: string): string => {
    switch (type) {
      case 'earn': return 'text-green-600';
      case 'redeem': return 'text-red-600';
      case 'level_change': return 'text-blue-600 font-bold';
      default: return '';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedHistory = [...(client.loyalty_history || [])].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Programme de Fidélité</h2>

      <div className={`mb-6 p-4 rounded-lg text-white ${
        client.loyalty_level === 'standard' ? 'bg-gray-600' :
        client.loyalty_level === 'silver' ? 'bg-gray-400' :
        client.loyalty_level === 'gold' ? 'bg-yellow-500' : 'bg-blue-500'
      }`}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Niveau {getLevelName(client.loyalty_level)}</h3>
          <div className="text-center">
            <span className="text-3xl font-bold">{client.loyalty_points}</span>
            <span className="ml-1">points</span>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Avantages du niveau {getLevelName(client.loyalty_level)}</h3>
        <ul className="list-disc pl-5">
          {levelBenefits.benefits.map((benefit, index) => (
            <li key={index} className="py-1">{benefit}</li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Progression</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between mb-4">
            <div className={`px-3 py-2 rounded ${client.loyalty_level === 'standard' ? 'bg-gray-600 text-white font-bold' : 'bg-gray-300'}`}>Standard</div>
            <div className={`px-3 py-2 rounded ${client.loyalty_level === 'silver' ? 'bg-gray-400 text-white font-bold' : 'bg-gray-300'}`}>Silver</div>
            <div className={`px-3 py-2 rounded ${client.loyalty_level === 'gold' ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-300'}`}>Gold</div>
            <div className={`px-3 py-2 rounded ${client.loyalty_level === 'platinum' ? 'bg-blue-500 text-white font-bold' : 'bg-gray-300'}`}>Platinum</div>
          </div>
          {client.loyalty_level !== 'platinum' ? (
            <p className="text-center font-semibold">
              {getNextLevelPoints(client.loyalty_level) - client.loyalty_points} points supplémentaires pour atteindre le niveau {getNextLevelName(client.loyalty_level)}
            </p>
          ) : (
            <p className="text-center font-semibold text-green-600">
              Félicitations ! Vous avez atteint le niveau maximum.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Ajouter des points</h3>
          <div className="mb-2">
            <label htmlFor="add-points" className="block text-gray-700 mb-1">Points</label>
            <input
              type="number"
              id="add-points"
              value={addPoints || ''}
              onChange={(e) => setAddPoints(parseInt(e.target.value) || null)}
              min="1"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-2">
            <label htmlFor="add-description" className="block text-gray-700 mb-1">Description</label>
            <input
              type="text"
              id="add-description"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              placeholder="Raison de l'ajout"
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            onClick={handleAddPoints}
            disabled={!addPoints || addPoints <= 0}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            Ajouter
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Utiliser des points</h3>
          <div className="mb-2">
            <label htmlFor="redeem-points" className="block text-gray-700 mb-1">Points</label>
            <input
              type="number"
              id="redeem-points"
              value={redeemPoints || ''}
              onChange={(e) => setRedeemPoints(parseInt(e.target.value) || null)}
              min="1"
              max={client.loyalty_points}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-2">
            <label htmlFor="redeem-description" className="block text-gray-700 mb-1">Description</label>
            <input
              type="text"
              id="redeem-description"
              value={redeemDescription}
              onChange={(e) => setRedeemDescription(e.target.value)}
              placeholder="Raison de l'utilisation"
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            onClick={handleRedeemPoints}
            disabled={!redeemPoints || redeemPoints <= 0 || redeemPoints > client.loyalty_points}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            Utiliser
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Historique des points</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Type</th>
                <th className="py-2 px-4 text-left">Points</th>
                <th className="py-2 px-4 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map((item, index) => (
                <tr key={index} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <td className="py-2 px-4">{formatDate(item.date)}</td>
                  <td className="py-2 px-4">{getHistoryTypeLabel(item.type)}</td>
                  <td className={`py-2 px-4 ${getHistoryItemClass(item.type)}`}>
                    {item.points_change > 0 ? '+' + item.points_change : item.points_change}
                  </td>
                  <td className="py-2 px-4">{item.description}</td>
                </tr>
              ))}
              {sortedHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    Aucun historique disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientLoyalty;
