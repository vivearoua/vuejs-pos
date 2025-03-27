export interface RepairPart {
  id: string;
  name: string;
  cost: number;
  quantity: number;
}

export interface Repair {
  id: string;
  phone_id?: string;
  client_id: string;
  customer_name: string;
  customer_phone: string | null;
  issue: string;
  diagnosis?: string;
  cost: number;
  parts_used: string[];
  labor_cost?: number;
  status: 'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled';
  technician_notes?: string;
  start_date: string;
  estimated_completion?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RepairFilter {
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

class RepairService {
  private static instance: RepairService;
  private repairs: Repair[] = [];
  private parts: RepairPart[] = [];
  private subscribers: ((type: string, data: any) => void)[] = [];

  private constructor() {
    this.loadFromStorage();
    // Si aucune réparation n'est chargée, initialiser avec les données de store.json
    if (this.repairs.length === 0) {
      this.initializeFromStoreData();
    }
  }

  public static getInstance(): RepairService {
    if (!RepairService.instance) {
      RepairService.instance = new RepairService();
    }
    return RepairService.instance;
  }

  private loadFromStorage(): void {
    const savedRepairs = localStorage.getItem('repairs');
    const savedParts = localStorage.getItem('repair_parts');

    if (savedRepairs) {
      this.repairs = JSON.parse(savedRepairs);
    }

    if (savedParts) {
      this.parts = JSON.parse(savedParts);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('repairs', JSON.stringify(this.repairs));
    localStorage.setItem('repair_parts', JSON.stringify(this.parts));
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
      
      // Convertir les réparations au format de notre application
      if (data.repairs) {
        this.repairs = data.repairs.map((repair: any) => ({
          id: repair.id,
          phone_id: repair.phone_id,
          client_id: repair.client_id,
          customer_name: repair.customer_name,
          customer_phone: repair.customer_phone,
          issue: repair.issue,
          diagnosis: repair.diagnosis || '',
          cost: repair.cost,
          parts_used: repair.parts_used || [],
          labor_cost: repair.labor_cost || repair.cost * 0.3, // Estimation par défaut
          status: this.mapStatus(repair.status),
          technician_notes: repair.technician_notes || '',
          start_date: repair.start_date,
          estimated_completion: repair.estimated_completion,
          completed_date: repair.completed_date,
          created_at: repair.start_date, // Utiliser start_date comme date de création
          updated_at: repair.completed_date || repair.start_date // Dernière mise à jour
        }));
      }
      
      // Initialiser quelques pièces de réparation par défaut si nécessaire
      if (!this.parts.length) {
        this.parts = [
          { id: 'P001', name: 'Écran LCD', cost: 45.00, quantity: 10 },
          { id: 'P002', name: 'Batterie', cost: 25.00, quantity: 15 },
          { id: 'P003', name: 'Connecteur de charge', cost: 12.00, quantity: 8 },
          { id: 'P004', name: 'Caméra arrière', cost: 35.00, quantity: 5 },
          { id: 'P005', name: 'Haut-parleur', cost: 10.00, quantity: 12 }
        ];
      }
      
      this.saveToStorage();
      console.log('Réparations initialisées depuis store.json:', this.repairs.length);
    } catch (error) {
      console.error('Erreur lors du chargement des réparations depuis store.json:', error);
    }
  }

  private mapStatus(status: string): Repair['status'] {
    const statusMap: Record<string, Repair['status']> = {
      'Pending': 'pending',
      'In Progress': 'in_progress',
      'Waiting for Parts': 'waiting_parts',
      'Completed': 'completed',
      'Cancelled': 'cancelled'
    };
    
    return statusMap[status] || 'pending';
  }

  public getRepairs(filters?: RepairFilter): Repair[] {
    let filteredRepairs = [...this.repairs];
    
    if (filters) {
      if (filters.status) {
        filteredRepairs = filteredRepairs.filter(repair => repair.status === filters.status);
      }
      
      if (filters.clientId) {
        filteredRepairs = filteredRepairs.filter(repair => repair.client_id === filters.clientId);
      }
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filteredRepairs = filteredRepairs.filter(repair => new Date(repair.start_date) >= fromDate);
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        filteredRepairs = filteredRepairs.filter(repair => new Date(repair.start_date) <= toDate);
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredRepairs = filteredRepairs.filter(repair => 
          repair.customer_name.toLowerCase().includes(term) ||
          repair.issue.toLowerCase().includes(term) ||
          repair.id.toLowerCase().includes(term)
        );
      }
    }
    
    // Trier par date de création, les plus récentes en premier
    return filteredRepairs.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getRepairById(id: string): Repair | undefined {
    return this.repairs.find(repair => repair.id === id);
  }

  public getRepairsByClientId(clientId: string): Repair[] {
    return this.repairs
      .filter(repair => repair.client_id === clientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addRepair(repair: Omit<Repair, 'id' | 'created_at' | 'updated_at'>): Repair {
    const now = new Date().toISOString();
    const newRepair: Repair = {
      ...repair,
      id: `R${Date.now().toString().slice(-6)}`,
      created_at: now,
      updated_at: now
    };
    
    this.repairs.push(newRepair);
    this.saveToStorage();
    this.notify('repair_added', newRepair);
    return newRepair;
  }

  public updateRepair(id: string, updates: Partial<Omit<Repair, 'id' | 'created_at'>>): Repair | undefined {
    const index = this.repairs.findIndex(repair => repair.id === id);
    if (index === -1) return undefined;
    
    const updatedRepair = {
      ...this.repairs[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.repairs[index] = updatedRepair;
    this.saveToStorage();
    this.notify('repair_updated', updatedRepair);
    return updatedRepair;
  }

  public deleteRepair(id: string): boolean {
    const index = this.repairs.findIndex(repair => repair.id === id);
    if (index === -1) return false;
    
    const deletedRepair = this.repairs[index];
    this.repairs.splice(index, 1);
    this.saveToStorage();
    this.notify('repair_deleted', deletedRepair);
    return true;
  }

  public updateRepairStatus(id: string, status: Repair['status']): Repair | undefined {
    const repair = this.getRepairById(id);
    if (!repair) return undefined;
    
    const updates: Partial<Repair> = { status };
    
    // Si la réparation est terminée, ajouter la date de fin
    if (status === 'completed' && !repair.completed_date) {
      updates.completed_date = new Date().toISOString();
    }
    
    return this.updateRepair(id, updates);
  }

  // Gestion des pièces de réparation
  public getParts(): RepairPart[] {
    return [...this.parts];
  }

  public getPartById(id: string): RepairPart | undefined {
    return this.parts.find(part => part.id === id);
  }

  public addPart(part: Omit<RepairPart, 'id'>): RepairPart {
    const newPart: RepairPart = {
      ...part,
      id: `P${Date.now().toString().slice(-6)}`
    };
    
    this.parts.push(newPart);
    this.saveToStorage();
    this.notify('part_added', newPart);
    return newPart;
  }

  public updatePart(id: string, updates: Partial<Omit<RepairPart, 'id'>>): RepairPart | undefined {
    const index = this.parts.findIndex(part => part.id === id);
    if (index === -1) return undefined;
    
    const updatedPart = {
      ...this.parts[index],
      ...updates
    };
    
    this.parts[index] = updatedPart;
    this.saveToStorage();
    this.notify('part_updated', updatedPart);
    return updatedPart;
  }

  public deletePart(id: string): boolean {
    const index = this.parts.findIndex(part => part.id === id);
    if (index === -1) return false;
    
    const deletedPart = this.parts[index];
    this.parts.splice(index, 1);
    this.saveToStorage();
    this.notify('part_deleted', deletedPart);
    return true;
  }

  public getRepairStats(): { 
    total: number, 
    pending: number, 
    inProgress: number, 
    completed: number,
    averageCompletionTime: number 
  } {
    const total = this.repairs.length;
    const pending = this.repairs.filter(r => r.status === 'pending').length;
    const inProgress = this.repairs.filter(r => r.status === 'in_progress' || r.status === 'waiting_parts').length;
    const completed = this.repairs.filter(r => r.status === 'completed').length;
    
    // Calculer le temps moyen de réparation (en jours)
    let totalDays = 0;
    let completedWithDates = 0;
    
    this.repairs.forEach(repair => {
      if (repair.status === 'completed' && repair.start_date && repair.completed_date) {
        const startDate = new Date(repair.start_date);
        const endDate = new Date(repair.completed_date);
        const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        totalDays += days;
        completedWithDates++;
      }
    });
    
    const averageCompletionTime = completedWithDates > 0 ? totalDays / completedWithDates : 0;
    
    return { total, pending, inProgress, completed, averageCompletionTime };
  }

  public exportRepairsToCSV(): string {
    const headers = [
      'ID', 'Client', 'Téléphone', 'Problème', 'Statut', 
      'Date de début', 'Date estimée', 'Date de fin', 'Coût'
    ];
    
    const rows = this.repairs.map(repair => [
      repair.id,
      repair.customer_name,
      repair.customer_phone || '',
      repair.issue,
      this.getStatusLabel(repair.status),
      repair.start_date,
      repair.estimated_completion || '',
      repair.completed_date || '',
      repair.cost.toString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }

  private getStatusLabel(status: Repair['status']): string {
    const statusLabels: Record<Repair['status'], string> = {
      'pending': 'En attente',
      'in_progress': 'En cours',
      'waiting_parts': 'Attente pièces',
      'completed': 'Terminé',
      'cancelled': 'Annulé'
    };
    
    return statusLabels[status] || status;
  }
}

export const repairService = RepairService.getInstance();
