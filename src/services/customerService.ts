import storeData from '../data/store.json';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

// Interface pour le format client dans store.json
interface StoreClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  registration_date: string | null;
  notes: string | null;
}

class CustomerService {
  private static instance: CustomerService;
  private customers: Customer[] = [];

  private constructor() {
    // Charger les clients depuis store.json
    try {
      const storeClients = storeData.clients as StoreClient[];
      if (storeClients && storeClients.length > 0) {
        this.customers = storeClients.map(client => this.convertFromStoreFormat(client));
        console.log('Clients chargés depuis store.json:', this.customers.length);
      } else {
        // Créer un client par défaut si aucun n'existe
        this.customers = [
          {
            id: 'CST-001',
            name: 'Client Passager',
            notes: 'Client par défaut pour les transactions rapides'
          }
        ];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients depuis store.json:', error);
      // Créer un client par défaut en cas d'erreur
      this.customers = [
        {
          id: 'CST-001',
          name: 'Client Passager',
          notes: 'Client par défaut pour les transactions rapides'
        }
      ];
    }
  }

  public static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  // Convertir un client du format store.json au format de l'application
  private convertFromStoreFormat(storeClient: StoreClient): Customer {
    return {
      id: storeClient.id,
      name: storeClient.name,
      email: storeClient.email || undefined,
      phone: storeClient.phone || undefined,
      address: storeClient.address || undefined,
      notes: storeClient.notes || undefined
    };
  }

  // Convertir un client du format de l'application au format store.json
  private convertToStoreFormat(customer: Customer): StoreClient {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email || null,
      phone: customer.phone || null,
      address: customer.address || null,
      registration_date: new Date().toISOString(),
      notes: customer.notes || null
    };
  }

  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find(c => c.id === id);
  }

  public getCustomerByName(name: string): Customer | undefined {
    return this.customers.find(c => c.name === name);
  }

  public addCustomer(customerData: Omit<Customer, 'id'>): Customer {
    const newCustomer: Customer = {
      ...customerData,
      id: `C${this.customers.length.toString().padStart(3, '0')}`
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  public updateCustomer(customerId: string, customerData: Partial<Omit<Customer, 'id'>>): Customer | null {
    const index = this.customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      this.customers[index] = {
        ...this.customers[index],
        ...customerData
      };
      return this.customers[index];
    }
    return null;
  }

  public deleteCustomer(customerId: string): boolean {
    // Ne pas supprimer le client passager par défaut
    if (customerId === 'C000') {
      return false;
    }
    
    const index = this.customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      this.customers.splice(index, 1);
      return true;
    }
    return false;
  }

  // Obtenir ou créer un client passager
  public getOrCreateGuestCustomer(): Customer {
    const guestCustomer = this.getCustomerById('C000');
    if (guestCustomer) {
      return guestCustomer;
    } else {
      return this.addCustomer({
        name: 'Client Passager',
        notes: 'Client par défaut pour les transactions rapides'
      });
    }
  }
}

export const customerService = CustomerService.getInstance();
