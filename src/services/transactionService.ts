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

class TransactionService {
  private static instance: TransactionService;
  private transactions: Transaction[] = [];

  private constructor() {
    // Charger les transactions depuis le localStorage
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      this.transactions = JSON.parse(savedTransactions);
    }
  }

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  private saveToStorage(): void {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
  }

  public createTransaction(data: Omit<Transaction, 'id' | 'date'>): Transaction {
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
}

export const transactionService = TransactionService.getInstance();
