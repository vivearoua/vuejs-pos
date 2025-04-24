<template>
  <div class="loyalty-container">
    <div v-if="client">
      <div class="loyalty-header">
        <div class="loyalty-level" :class="client.loyalty_level">
          <h2>Niveau {{ getLevelName(client.loyalty_level) }}</h2>
          <div class="loyalty-points">
            <span class="points">{{ client.loyalty_points }}</span>
            <span class="points-label">points</span>
          </div>
        </div>
      </div>

      <div class="loyalty-benefits">
        <h3>Avantages du niveau {{ getLevelName(client.loyalty_level) }}</h3>
        <ul>
          <li v-for="(benefit, index) in levelBenefits.benefits" :key="index">
            {{ benefit }}
          </li>
        </ul>
      </div>

      <div class="loyalty-progress">
        <h3>Progression</h3>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-level standard" :class="{ active: client.loyalty_level === 'standard' }">Standard</div>
            <div class="progress-level silver" :class="{ active: client.loyalty_level === 'silver' }">Silver</div>
            <div class="progress-level gold" :class="{ active: client.loyalty_level === 'gold' }">Gold</div>
            <div class="progress-level platinum" :class="{ active: client.loyalty_level === 'platinum' }">Platinum</div>
          </div>
          <div class="progress-info">
            <div v-if="client.loyalty_level !== 'platinum'">
              <p>{{ getNextLevelPoints(client.loyalty_level) - client.loyalty_points }} points supplémentaires pour atteindre le niveau {{ getNextLevelName(client.loyalty_level) }}</p>
            </div>
            <div v-else>
              <p>Félicitations ! Vous avez atteint le niveau maximum.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="loyalty-actions">
        <div class="action-section">
          <h3>Ajouter des points</h3>
          <div class="action-form">
            <div class="form-group">
              <label for="add-points">Points</label>
              <input type="number" id="add-points" v-model="addPoints" min="1" />
            </div>
            <div class="form-group">
              <label for="add-description">Description</label>
              <input type="text" id="add-description" v-model="addDescription" placeholder="Raison de l'ajout" />
            </div>
            <button @click="handleAddPoints" :disabled="!addPoints || addPoints <= 0" class="btn btn-primary">
              Ajouter
            </button>
          </div>
        </div>

        <div class="action-section">
          <h3>Utiliser des points</h3>
          <div class="action-form">
            <div class="form-group">
              <label for="redeem-points">Points</label>
              <input type="number" id="redeem-points" v-model="redeemPoints" min="1" :max="client.loyalty_points" />
            </div>
            <div class="form-group">
              <label for="redeem-description">Description</label>
              <input type="text" id="redeem-description" v-model="redeemDescription" placeholder="Raison de l'utilisation" />
            </div>
            <button @click="handleRedeemPoints" :disabled="!redeemPoints || redeemPoints <= 0 || redeemPoints > client.loyalty_points" class="btn btn-primary">
              Utiliser
            </button>
          </div>
        </div>
      </div>

      <div class="loyalty-history">
        <h3>Historique des points</h3>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Points</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in sortedHistory" :key="index" :class="getHistoryItemClass(item)">
              <td>{{ formatDate(item.date) }}</td>
              <td>{{ getHistoryTypeLabel(item.type) }}</td>
              <td>{{ item.points_change > 0 ? '+' + item.points_change : item.points_change }}</td>
              <td>{{ item.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="no-client">
      <p>Veuillez sélectionner un client pour voir son programme de fidélité.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue';
import { Client, LoyaltyHistoryItem, clientService } from '@/services/clientService';

export default defineComponent({
  name: 'ClientLoyalty',
  props: {
    client: {
      type: Object as PropType<Client>,
      required: true
    }
  },
  setup(props) {
    const addPoints = ref<number>(null);
    const addDescription = ref('');
    const redeemPoints = ref<number>(null);
    const redeemDescription = ref('');

    const levelBenefits = computed(() => {
      if (!props.client) return { discount: 0, benefits: [] };
      return clientService.getLoyaltyLevelBenefits(props.client.loyalty_level);
    });

    const sortedHistory = computed(() => {
      if (!props.client || !props.client.loyalty_history) return [];
      return [...props.client.loyalty_history].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    });

    const handleAddPoints = async () => {
      if (!props.client || !addPoints.value || addPoints.value <= 0) return;
      
      try {
        await clientService.addLoyaltyPoints(
          props.client.id,
          addPoints.value,
          addDescription.value || 'Ajout manuel de points'
        );
        
        // Réinitialiser les champs
        addPoints.value = null;
        addDescription.value = '';
      } catch (error) {
        console.error('Erreur lors de l\'ajout de points:', error);
      }
    };

    const handleRedeemPoints = async () => {
      if (!props.client || !redeemPoints.value || redeemPoints.value <= 0 || redeemPoints.value > props.client.loyalty_points) return;
      
      try {
        await clientService.redeemLoyaltyPoints(
          props.client.id,
          redeemPoints.value,
          redeemDescription.value || 'Utilisation manuelle de points'
        );
        
        // Réinitialiser les champs
        redeemPoints.value = null;
        redeemDescription.value = '';
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

    const getHistoryItemClass = (item: LoyaltyHistoryItem): string => {
      switch (item.type) {
        case 'earn': return 'history-earn';
        case 'redeem': return 'history-redeem';
        case 'level_change': return 'history-level';
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

    return {
      addPoints,
      addDescription,
      redeemPoints,
      redeemDescription,
      levelBenefits,
      sortedHistory,
      handleAddPoints,
      handleRedeemPoints,
      getLevelName,
      getNextLevelName,
      getNextLevelPoints,
      getHistoryTypeLabel,
      getHistoryItemClass,
      formatDate
    };
  }
});
</script>

<style scoped>
.loyalty-container {
  padding: 20px;
}

.loyalty-header {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.loyalty-level {
  text-align: center;
  padding: 20px;
  border-radius: 10px;
  width: 300px;
  color: white;
}

.loyalty-level.standard {
  background-color: #6c757d;
}

.loyalty-level.silver {
  background-color: #adb5bd;
}

.loyalty-level.gold {
  background-color: #ffc107;
  color: #212529;
}

.loyalty-level.platinum {
  background-color: #17a2b8;
}

.loyalty-points {
  margin-top: 10px;
}

.points {
  font-size: 2.5rem;
  font-weight: bold;
}

.points-label {
  font-size: 1.2rem;
  margin-left: 5px;
}

.loyalty-benefits {
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.loyalty-benefits ul {
  list-style-type: none;
  padding-left: 0;
}

.loyalty-benefits li {
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.loyalty-benefits li:last-child {
  border-bottom: none;
}

.loyalty-progress {
  margin-bottom: 30px;
}

.progress-container {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
}

.progress-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.progress-level {
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  flex-grow: 1;
  margin: 0 5px;
  opacity: 0.5;
}

.progress-level.active {
  opacity: 1;
  font-weight: bold;
}

.progress-level.standard {
  background-color: #6c757d;
  color: white;
}

.progress-level.silver {
  background-color: #adb5bd;
  color: white;
}

.progress-level.gold {
  background-color: #ffc107;
  color: #212529;
}

.progress-level.platinum {
  background-color: #17a2b8;
  color: white;
}

.progress-info {
  text-align: center;
  font-weight: bold;
}

.loyalty-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.action-section {
  width: 48%;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
}

.action-form {
  margin-top: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0069d9;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.loyalty-history {
  margin-top: 30px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.table th {
  background-color: #f8f9fa;
}

.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.history-earn {
  color: #28a745;
}

.history-redeem {
  color: #dc3545;
}

.history-level {
  color: #17a2b8;
  font-weight: bold;
}

.no-client {
  text-align: center;
  padding: 50px;
  background-color: #f8f9fa;
  border-radius: 5px;
}
</style>
