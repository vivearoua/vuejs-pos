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
}

class ClientService {
  private static instance: ClientService;
  private clients: Client[] = [];
  private subscribers: ((type: string, data: any) => void)[] = [];

  private constructor() {
    this.loadFromStorage();
    // Si aucun client n'est chargé, initialiser avec les données de store.json
    if (this.clients.length === 0) {
      this.initializeFromStoreData();
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

  private async initializeFromStoreData(): Promise<void> {
    try {
      const storeData = await import('../data/store.json');
      const data = storeData.default || storeData;
      
      // Convertir les clients au format de notre application
      this.clients = data.clients.map((client: any) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        registration_date: client.registration_date,
        notes: client.notes,
        // Calculer les statistiques d'achat basées sur les transactions
        total_purchases: this.calculateTotalPurchases(client.id, data.transactions),
        last_purchase_date: this.findLastPurchaseDate(client.id, data.transactions)
      }));
      
      this.saveToStorage();
      console.log('Clients initialisés depuis store.json:', this.clients.length);
    } catch (error) {
      console.error('Erreur lors du chargement des clients depuis store.json:', error);
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
    const headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Adresse', 'Date d\'inscription', 'Notes', 'Total des achats', 'Dernier achat'];
    const rows = this.clients.map(client => [
      client.id,
      client.name,
      client.email || '',
      client.phone || '',
      client.address || '',
      client.registration_date || '',
      client.notes || '',
      client.total_purchases?.toString() || '0',
      client.last_purchase_date || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }
}

export const clientService = ClientService.getInstance();
