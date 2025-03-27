export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

class CustomerService {
  private static instance: CustomerService;
  private customers: Customer[] = [];

  private constructor() {
    // Charger les clients depuis le localStorage
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      this.customers = JSON.parse(savedCustomers);
    } else {
      // Créer un client par défaut si aucun n'existe
      this.customers = [
        {
          id: 'CST-001',
          name: 'Client Passager',
          notes: 'Client par défaut pour les transactions rapides'
        }
      ];
      this.saveToStorage();
    }
  }

  public static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  private saveToStorage(): void {
    localStorage.setItem('customers', JSON.stringify(this.customers));
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
      id: `CST-${Date.now()}`
    };
    this.customers.push(newCustomer);
    this.saveToStorage();
    return newCustomer;
  }

  public updateCustomer(customerId: string, customerData: Partial<Omit<Customer, 'id'>>): Customer | null {
    const index = this.customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      this.customers[index] = {
        ...this.customers[index],
        ...customerData
      };
      this.saveToStorage();
      return this.customers[index];
    }
    return null;
  }

  public deleteCustomer(customerId: string): boolean {
    // Ne pas supprimer le client passager par défaut
    if (customerId === 'CST-001') {
      return false;
    }
    
    const index = this.customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      this.customers.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Obtenir ou créer un client passager
  public getOrCreateGuestCustomer(): Customer {
    const guestCustomer = this.getCustomerById('CST-001');
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
