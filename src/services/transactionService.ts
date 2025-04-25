import { PaymentDetails } from '../components/PaymentModal';
import { inventoryService } from './inventoryService';

export interface CartItem {
  id: string;
  name: string;
  type: 'phone' | 'accessory';
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  date: string;
  customer: string;
  customerId: string; 
  cashier: string; 
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxAmount: number;
  discount: number;
  discountAmount: number;
  shipping: number;
  total: number;
  payment: PaymentDetails;
}

// Interface pour le format de transaction dans store.json
interface BaseStoreTransaction {
  id: string;
  user_id: string;
  client_id: string;
  type: string;
  total_amount: number;
  discount: number;
  payment_method: string;
  timestamp: string;
  customer_name: string;
}

interface SaleStoreTransaction extends BaseStoreTransaction {
  type: 'sale';
  items: {
    item_type: string;
    item_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

interface RepairStoreTransaction extends BaseStoreTransaction {
  type: 'repair';
  repair_id: string;
}

type StoreTransaction = SaleStoreTransaction | RepairStoreTransaction;

class TransactionService {
  private static instance: TransactionService;
  private transactions: Transaction[] = [];
  private storeTransactions: StoreTransaction[] = [];
  private apiUrl = import.meta.env.VITE_API_URL;

  private constructor() {
    // Charger les transactions depuis le localStorage
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      this.transactions = JSON.parse(savedTransactions);
    }
    
    // Initialiser le tableau de transactions du store
    this.storeTransactions = [];
    
    // Charger les transactions depuis l'API
    this.fetchTransactionsFromAPI();
  }
  
  private async fetchTransactionsFromAPI(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/transactions`);
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des transactions: ${response.status}`);
      }
      const data = await response.json();
      this.storeTransactions = data as StoreTransaction[];
    } catch (error) {
      console.error('Erreur lors du chargement des transactions depuis l\'API:', error);
    }
  }

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  private saveToStorage(): void {
    try {
      // Sauvegarder dans localStorage
      localStorage.setItem('transactions', JSON.stringify(this.transactions));
      
      // Convertir la transaction au format store.json
      const lastTransaction = this.transactions[this.transactions.length - 1];
      if (lastTransaction) {
        const storeTransaction: SaleStoreTransaction = this.convertToStoreFormat(lastTransaction);
        
        // Ajouter à la liste des transactions du store
        this.storeTransactions.push(storeTransaction);
        
        // Afficher les données qui seraient sauvegardées dans store.json
        console.log('Transaction ajoutée à store.json:', storeTransaction);
        
        // Envoyer la transaction au serveur API de manière asynchrone
        // sans bloquer l'interface utilisateur
        setTimeout(() => {
          this.sendTransactionToServer(storeTransaction)
            .catch(err => console.error('Erreur lors de l\'envoi de la transaction:', err));
        }, 100);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des transactions:', error);
    }
  }

  // Envoyer la transaction au serveur API
  private async sendTransactionToServer(transaction: StoreTransaction): Promise<void> {
    try {
      // Vérifier que la transaction est bien définie et a un type
      if (!transaction || !transaction.type) {
        console.error('Transaction invalide ou sans type:', transaction);
        throw new Error('La transaction est invalide ou ne contient pas de type');
      }

      // S'assurer que les valeurs numériques sont bien des nombres
      const formattedTransaction = {
        ...transaction,
        total_amount: parseFloat(transaction.total_amount as any),
        discount: parseFloat((transaction.discount || 0) as any)
      };

      // Pour les transactions de type 'sale', formater les items
      if (formattedTransaction.type === 'sale' && Array.isArray(formattedTransaction.items)) {
        formattedTransaction.items = formattedTransaction.items.map(item => ({
          item_type: item.item_type,
          item_id: item.item_id,
          quantity: parseInt(item.quantity as any),
          unit_price: parseFloat(item.unit_price as any)
        }));
      }

      console.log('Envoi de la transaction au serveur:', formattedTransaction);

      // Ne pas manipuler l'état d'authentification pendant la requête
      const response = await fetch(`${this.apiUrl}/newtransaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedTransaction),
        // Éviter que fetch ne modifie les cookies ou l'état d'authentification
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur lors de l'envoi de la transaction au serveur: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Transaction envoyée au serveur avec succès:', result);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la transaction au serveur:', error);
      // En cas d'erreur, on propose quand même le téléchargement du fichier store.json
      this.downloadUpdatedStoreJson();
    }
  }

  private convertToStoreFormat(transaction: Transaction): SaleStoreTransaction {
    return {
      id: transaction.id,
      user_id: 'U002', // ID du caissier (à remplacer par l'ID réel)
      client_id: transaction.customerId,
      type: 'sale',
      items: transaction.items.map(item => ({
        item_type: item.type,
        item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      })),
      total_amount: transaction.total,
      discount: transaction.discount,
      payment_method: transaction.payment.method === 'cash' ? 'Cash' : 'Credit Card',
      timestamp: transaction.date,
      customer_name: transaction.customer
    };
  }

  private async downloadUpdatedStoreJson(): Promise<void> {
    try {
      // Récupérer les données actuelles depuis l'API
      const response = await fetch(`${this.apiUrl}/transactions`);
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des transactions: ${response.status}`);
      }
      
      // Récupérer les données des produits
      const productsResponse = await fetch(`${this.apiUrl}/products`);
      if (!productsResponse.ok) {
        throw new Error(`Erreur lors de la récupération des produits: ${productsResponse.status}`);
      }
      
      // Récupérer les données des clients
      const clientsResponse = await fetch(`${this.apiUrl}/clients`);
      if (!clientsResponse.ok) {
        throw new Error(`Erreur lors de la récupération des clients: ${clientsResponse.status}`);
      }
      
      // Créer un objet store complet
      const updatedStoreData = {
        transactions: await response.json(),
        phones: (await productsResponse.json()).phones,
        accessories: (await productsResponse.json()).accessories,
        clients: await clientsResponse.json()
      };
      
      // Convertir en JSON
      const jsonContent = JSON.stringify(updatedStoreData, null, 2);
      
      // Créer un blob et le télécharger
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'store.json';
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Erreur lors de la génération du fichier store.json:', error);
    }
  }

  public createTransaction(data: Omit<Transaction, 'id' | 'date'>): Transaction {
    try {
      // Générer un ID unique pour la transaction
      const id = `T${Date.now()}`;
      const date = new Date().toISOString();
      
      // Créer l'objet transaction
      const transaction: Transaction = {
        id,
        date,
        ...data
      };
      
      
      // Ajouter la transaction à la liste
      this.transactions.push(transaction);
      
      // Sauvegarder dans le stockage local
      this.saveToStorage();
      
      return transaction;
    } catch (error) {
      console.error('Erreur lors de la création de la transaction:', error);
      throw error;
    }
  }

  /**
   * Met à jour le stock des produits dans l'inventaire
   * @param items Articles à déduire du stock
   */
  private updateInventory(items: CartItem[]): void {
    try {
      // Mettre à jour le stock pour chaque article
      items.forEach(item => {
        inventoryService.decreaseStock(item.id, item.quantity);
      });
      
      // Forcer la synchronisation avec productsdb.json
      inventoryService.syncWithProductsJson();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'inventaire:', error);
    }
  }

  public getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  public getTransactionById(id: string): Transaction | undefined {
    return this.transactions.find(t => t.id === id);
  }

  public getTransactionsByCustomer(customer: string): Transaction[] {
    return this.transactions.filter(t => t.customer === customer);
  }

  public getTransactionsByDateRange(start: Date, end: Date): Transaction[] {
    return this.transactions.filter(t => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });
  }

  public getDailyReport(date: Date): {
    totalSales: number;
    transactionCount: number;
    averageTicket: number;
    paymentMethods: {
      cash: number;
      card: number;
      transfer: number;
    };
  } {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTransactions = this.getTransactionsByDateRange(dayStart, dayEnd);
    const totalSales = dayTransactions.reduce((sum, t) => sum + t.total, 0);
    const paymentMethods = dayTransactions.reduce(
      (acc, t) => {
        acc[t.payment.method] += t.total;
        return acc;
      },
      { cash: 0, card: 0, transfer: 0 }
    );

    return {
      totalSales,
      transactionCount: dayTransactions.length,
      averageTicket: dayTransactions.length ? totalSales / dayTransactions.length : 0,
      paymentMethods,
    };
  }

  public exportTransactionsToJSON(): string {
    return JSON.stringify(this.transactions, null, 2);
  }

  public exportTransactionsToCSV(): string {
    if (this.transactions.length === 0) {
      return 'Aucune transaction à exporter';
    }

    // Créer les en-têtes
    const headers = [
      'ID', 'Date', 'Client', 'ID Client', 'Caissier', 'Sous-total', 
      'TVA (%)', 'Montant TVA', 'Remise (%)', 'Montant Remise', 
      'Livraison', 'Total', 'Méthode de paiement'
    ];

    // Créer les lignes
    const rows = this.transactions.map(t => [
      t.id,
      new Date(t.date).toLocaleString('fr-FR'),
      t.customer,
      t.customerId,
      t.cashier,
      t.subtotal.toFixed(2),
      t.tax.toFixed(2),
      t.taxAmount.toFixed(2),
      t.discount.toFixed(2),
      t.discountAmount.toFixed(2),
      t.shipping.toFixed(2),
      t.total.toFixed(2),
      t.payment.method === 'cash' ? 'Espèces' : t.payment.method
    ]);

    // Combiner en-têtes et lignes
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  public downloadTransactionsAsJSON(): void {
    const jsonContent = this.exportTransactionsToJSON();
    this.downloadFile(jsonContent, 'transactions.json', 'application/json');
  }

  public downloadTransactionsAsCSV(): void {
    const csvContent = this.exportTransactionsToCSV();
    this.downloadFile(csvContent, 'transactions.csv', 'text/csv');
  }

  private downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: `${contentType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const transactionService = TransactionService.getInstance();
