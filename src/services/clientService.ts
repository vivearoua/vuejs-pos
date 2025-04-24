export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  registration_date: string | null;
  notes: string | null;
  total_purchases?: number;
  last_purchase_date?: string;
  // Attributs du programme de fidélité
  loyalty_points: number;
  loyalty_level: 'standard' | 'silver' | 'gold' | 'platinum';
  loyalty_card_number?: string;
  loyalty_registration_date?: string;
  loyalty_history?: LoyaltyHistoryItem[];
}

export interface LoyaltyHistoryItem {
  date: string;
  type: 'earn' | 'redeem' | 'level_change';
  points_change: number;
  transaction_id?: string;
  description: string;
  previous_level?: string;
  new_level?: string;
}

class ClientService {
  private static instance: ClientService;
  private clients: Client[] = [];
  private subscribers: ((type: string, data: any) => void)[] = [];
  private clientsData: any = null;
  private storeData: any = null;

  private constructor() {
    this.loadFromStorage();
    // Si aucun client n'est chargé, initialiser avec les données de clientsdb.json
    if (this.clients.length === 0) {
      this.initializeFromClientData();
    }
  }

  public static getInstance(): ClientService {
    if (!ClientService.instance) {
      ClientService.instance = new ClientService();
    }
    return ClientService.instance;
  }

  private loadFromStorage(): void {
    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      this.clients = JSON.parse(savedClients);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('clients', JSON.stringify(this.clients));
    this.updateClientsJson();
  }

  private updateClientsJson(): void {
    (async () => {
      try {
        if (!this.clientsData) {
          const clientsData = await import('../data/clientsdb.json');
          this.clientsData = clientsData.default || clientsData;
        }
        
        // Update only the clients part of the clients data
        this.clientsData.clients = this.clients.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          registration_date: client.registration_date,
          notes: client.notes,
          loyalty_points: client.loyalty_points,
          loyalty_level: client.loyalty_level,
          loyalty_card_number: client.loyalty_card_number,
          loyalty_registration_date: client.loyalty_registration_date,
          loyalty_history: client.loyalty_history
        }));
        
        // Use the API endpoint to save the updated clients data
        fetch(`${import.meta.env.VITE_API_URL}/updateclients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            data: this.clientsData.clients 
          }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to update clientsdb.json');
          }
          return response.json();
        })
        .then(data => console.log('clientsdb.json updated successfully:', data))
        .catch(error => console.error('Error updating clientsdb.json:', error));
      } catch (error) {
        console.error('Error preparing data for clientsdb.json update:', error);
      }
    })();
  }

  public subscribe(callback: (type: string, data: any) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notify(type: string, data: any): void {
    this.subscribers.forEach(callback => callback(type, data));
  }

  private async initializeFromClientData(): Promise<void> {
    try {
      // Charger les clients depuis l'API
      await this.loadClientsFromApi();
      
      // Charger les transactions depuis store.json pour calculer les statistiques
      const storeData = await import('../data/store.json');
      this.storeData = storeData.default || storeData;
      
      // Mettre à jour les statistiques d'achat
      this.clients = this.clients.map(client => ({
        ...client,
        // Calculer les statistiques d'achat basées sur les transactions
        total_purchases: this.calculateTotalPurchases(client.id, this.storeData.transactions),
        last_purchase_date: this.findLastPurchaseDate(client.id, this.storeData.transactions),
        loyalty_points: 0,
        loyalty_level: 'standard',
        loyalty_card_number: undefined,
        loyalty_registration_date: undefined,
        loyalty_history: []
      }));
      
      this.saveToStorage();
      console.log('Clients initialisés depuis clientsdb.json:', this.clients.length);
    } catch (error) {
      console.error('Erreur lors du chargement des clients depuis clientsdb.json:', error);
      
      // Fallback: charger depuis le fichier local si l'API échoue
      try {
        const clientsData = await import('../data/clientsdb.json');
        this.clientsData = clientsData.default || clientsData;
        
        this.clients = this.clientsData.clients.map((client: any) => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          registration_date: client.registration_date,
          notes: client.notes,
          loyalty_points: client.loyalty_points || 0,
          loyalty_level: client.loyalty_level || 'standard',
          loyalty_card_number: client.loyalty_card_number,
          loyalty_registration_date: client.loyalty_registration_date,
          loyalty_history: client.loyalty_history || []
        }));
        
        console.log('Clients chargés depuis le fichier local:', this.clients.length);
      } catch (fallbackError) {
        console.error('Échec du chargement de secours:', fallbackError);
      }
    }
  }

  private async loadClientsFromApi(): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/clients`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des clients depuis l\'API');
      }
      
      const clients = await response.json();
      this.clients = clients;
      this.clientsData = { clients };
      console.log('Clients chargés depuis l\'API:', this.clients.length);
    } catch (error) {
      console.error('Erreur lors du chargement des clients depuis l\'API:', error);
      throw error; // Propager l'erreur pour le traitement de secours
    }
  }

  private calculateTotalPurchases(clientId: string, transactions: any[]): number {
    if (!transactions) return 0;
    return transactions
      .filter(t => t.client_id === clientId)
      .reduce((sum, t) => sum + t.total, 0);
  }

  private findLastPurchaseDate(clientId: string, transactions: any[]): string | undefined {
    if (!transactions) return undefined;
    const clientTransactions = transactions
      .filter(t => t.client_id === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return clientTransactions.length > 0 ? clientTransactions[0].date : undefined;
  }

  public getClients(): Client[] {
    return [...this.clients];
  }

  public getClientById(id: string): Client | undefined {
    return this.clients.find(client => client.id === id);
  }

  public searchClients(query: string): Client[] {
    if (!query) return this.getClients();
    
    const lowerQuery = query.toLowerCase();
    return this.clients.filter(client => 
      client.name.toLowerCase().includes(lowerQuery) ||
      (client.email && client.email.toLowerCase().includes(lowerQuery)) ||
      (client.phone && client.phone.includes(query)) ||
      (client.notes && client.notes.toLowerCase().includes(lowerQuery))
    );
  }

  public addClient(client: Omit<Client, 'id'>): Client {
    const newClient: Client = {
      ...client,
      id: `C${Date.now().toString().slice(-6)}`, // Générer un ID unique
      loyalty_points: 0,
      loyalty_level: 'standard',
      loyalty_card_number: undefined,
      loyalty_registration_date: undefined,
      loyalty_history: []
    };
    
    this.clients.push(newClient);
    this.saveToStorage();
    this.notify('client_added', newClient);
    return newClient;
  }

  public updateClient(id: string, updates: Partial<Omit<Client, 'id'>>): Client | undefined {
    const index = this.clients.findIndex(client => client.id === id);
    if (index === -1) return undefined;
    
    const updatedClient = {
      ...this.clients[index],
      ...updates
    };
    
    this.clients[index] = updatedClient;
    this.saveToStorage();
    this.notify('client_updated', updatedClient);
    return updatedClient;
  }

  public deleteClient(id: string): boolean {
    const index = this.clients.findIndex(client => client.id === id);
    if (index === -1) return false;
    
    const deletedClient = this.clients[index];
    this.clients.splice(index, 1);
    this.saveToStorage();
    this.notify('client_deleted', deletedClient);
    return true;
  }

  public getClientStats(): { total: number, active: number, new30Days: number } {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const total = this.clients.length;
    // Considérer un client actif s'il a fait un achat dans les 90 derniers jours
    const active = this.clients.filter(client => {
      if (!client.last_purchase_date) return false;
      const lastPurchase = new Date(client.last_purchase_date);
      return (now.getTime() - lastPurchase.getTime()) <= 90 * 24 * 60 * 60 * 1000;
    }).length;
    
    // Nouveaux clients des 30 derniers jours
    const new30Days = this.clients.filter(client => {
      if (!client.registration_date) return false;
      const regDate = new Date(client.registration_date);
      return regDate >= thirtyDaysAgo;
    }).length;
    
    return { total, active, new30Days };
  }

  public exportClientsToCSV(): string {
    const headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Adresse', 'Date d\'inscription', 'Notes', 'Total des achats', 'Dernier achat', 'Points de fidélité', 'Niveau de fidélité', 'Numéro de carte de fidélité', 'Date d\'inscription à la fidélité'];
    const rows = this.clients.map(client => [
      client.id,
      client.name,
      client.email || '',
      client.phone || '',
      client.address || '',
      client.registration_date || '',
      client.notes || '',
      client.total_purchases?.toString() || '0',
      client.last_purchase_date || '',
      client.loyalty_points.toString(),
      client.loyalty_level,
      client.loyalty_card_number || '',
      client.loyalty_registration_date || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }

  public addLoyaltyPoints(clientId: string, points: number, description?: string, transactionId?: string): Promise<Client | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/loyalty/add-points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            points,
            description,
            transactionId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l\'ajout de points de fidélité');
        }

        const data = await response.json();
        
        // Mettre à jour le client dans la liste locale
        const clientIndex = this.clients.findIndex(c => c.id === clientId);
        if (clientIndex !== -1) {
          this.clients[clientIndex] = data.client;
          this.notify('loyalty_points_updated', data.client);
        }
        
        resolve(data.client);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de points de fidélité:', error);
        reject(error);
      }
    });
  }

  public redeemLoyaltyPoints(clientId: string, points: number, description?: string): Promise<Client | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/loyalty/redeem-points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            points,
            description
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l\'utilisation de points de fidélité');
        }

        const data = await response.json();
        
        // Mettre à jour le client dans la liste locale
        const clientIndex = this.clients.findIndex(c => c.id === clientId);
        if (clientIndex !== -1) {
          this.clients[clientIndex] = data.client;
          this.notify('loyalty_points_redeemed', data.client);
        }
        
        resolve(data.client);
      } catch (error) {
        console.error('Erreur lors de l\'utilisation de points de fidélité:', error);
        reject(error);
      }
    });
  }

  public updateLoyaltyLevel(clientId: string, level: 'standard' | 'silver' | 'gold' | 'platinum'): Promise<Client | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/loyalty/update-level`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            level
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la mise à jour du niveau de fidélité');
        }

        const data = await response.json();
        
        // Mettre à jour le client dans la liste locale
        const clientIndex = this.clients.findIndex(c => c.id === clientId);
        if (clientIndex !== -1) {
          this.clients[clientIndex] = data.client;
          this.notify('loyalty_level_updated', data.client);
        }
        
        resolve(data.client);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du niveau de fidélité:', error);
        reject(error);
      }
    });
  }

  public getLoyaltyLevelBenefits(level: 'standard' | 'silver' | 'gold' | 'platinum'): { discount: number, benefits: string[] } {
    switch (level) {
      case 'platinum':
        return {
          discount: 15,
          benefits: [
            'Remise de 15% sur tous les achats',
            'Service prioritaire',
            'Accès aux ventes privées',
            'Réparations prioritaires',
            'Garantie prolongée sur les produits'
          ]
        };
      case 'gold':
        return {
          discount: 10,
          benefits: [
            'Remise de 10% sur tous les achats',
            'Service prioritaire',
            'Accès aux ventes privées',
            'Réparations prioritaires'
          ]
        };
      case 'silver':
        return {
          discount: 5,
          benefits: [
            'Remise de 5% sur tous les achats',
            'Service prioritaire',
            'Accès aux ventes privées'
          ]
        };
      default:
        return {
          discount: 0,
          benefits: [
            'Accès au programme de fidélité',
            'Cumul de points sur les achats'
          ]
        };
    }
  }

  public calculatePointsForPurchase(amount: number): number {
    // 1 point pour chaque 10€ d'achat, arrondi à l'entier inférieur
    return Math.floor(amount / 10);
  }
}

export const clientService = ClientService.getInstance();