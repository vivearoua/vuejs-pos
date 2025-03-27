import { PaymentDetails } from '../components/PaymentModal';
import { inventoryService } from './inventoryService';
import storeData from '../data/store.json';

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

  private constructor() {
    // Charger les transactions depuis le localStorage
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      this.transactions = JSON.parse(savedTransactions);
    }
    
    // Charger les transactions depuis store.json
    try {
      this.storeTransactions = storeData.transactions as StoreTransaction[];
    } catch (error) {
      console.error('Erreur lors du chargement des transactions depuis store.json:', error);
      this.storeTransactions = [];
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
        console.log('Nouvelles transactions dans store.json:', this.storeTransactions);
        
        // Dans une application réelle, nous sauvegarderions dans le fichier
        // mais comme nous sommes dans un navigateur, nous ne pouvons pas modifier directement le fichier
        this.downloadUpdatedStoreJson();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des transactions:', error);
    }
  }

  // Convertir une transaction au format utilisé dans store.json
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

  // Télécharger le fichier store.json mis à jour
  private downloadUpdatedStoreJson(): void {
    try {
      // Créer une copie du store.json avec les transactions mises à jour
      const updatedStore = { ...storeData, transactions: this.storeTransactions };
      
      // Créer un blob et proposer le téléchargement
      const jsonContent = JSON.stringify(updatedStore, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = 'store.json';
      
      // Simuler un clic pour télécharger le fichier
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Fichier store.json mis à jour et prêt à être téléchargé');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du fichier store.json:', error);
    }
  }

  public createTransaction(data: Omit<Transaction, 'id' | 'date'>): Transaction {
    // Vérifier que le client et le caissier sont spécifiés
    if (!data.customer || !data.customerId || !data.cashier) {
      throw new Error('Le client et le caissier sont obligatoires pour créer une transaction');
    }

    const transaction: Transaction = {
      ...data,
      id: `TR-${Date.now()}`,
      date: new Date().toISOString(),
    };

    this.transactions.push(transaction);
    this.saveToStorage();

    // Mettre à jour le stock
    this.updateInventory(transaction.items);

    return transaction;
  }

  private updateInventory(items: CartItem[]): void {
    items.forEach(item => {
      try {
        inventoryService.addMovement({
          productId: item.id,
          type: 'out',
          quantity: item.quantity,
          reason: 'sale'
        });
      } catch (err) {
        console.error(`Erreur lors de la mise à jour du stock pour ${item.name}:`, err);
      }
    });
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
