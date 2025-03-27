import { Transaction } from './transactionService';

/**
 * Service pour gérer les opérations de fichiers
 * Dans un environnement de navigateur, ce service simule les opérations de fichiers
 * Pour une application réelle, il faudrait un backend ou une API comme Electron
 */
class FileService {
  private static instance: FileService;

  private constructor() {
    // Écouter l'événement de sauvegarde de transaction
    window.addEventListener('transaction-saved', ((event: Event) => {
      const customEvent = event as CustomEvent<{ transactions: Transaction[] }>;
      if (customEvent.detail && customEvent.detail.transactions) {
        this.saveTransactionsToFile(customEvent.detail.transactions);
      }
    }) as EventListener);
  }

  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  /**
   * Sauvegarde les transactions dans un fichier JSON
   * Dans un environnement de navigateur, cette fonction simule la sauvegarde
   */
  private saveTransactionsToFile(transactions: Transaction[]): void {
    try {
      // Dans un environnement de navigateur, nous ne pouvons pas écrire directement dans le système de fichiers
      // Nous allons donc proposer un téléchargement du fichier
      const jsonContent = JSON.stringify(transactions, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement invisible
      const link = document.createElement('a');
      link.href = url;
      link.download = 'transactions.json';
      
      // Simuler un clic pour télécharger le fichier
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Fichier transactions.json prêt à être téléchargé');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du fichier transactions.json:', error);
    }
  }

  /**
   * Sauvegarde automatique des transactions dans le fichier JSON
   * Cette fonction est appelée périodiquement pour sauvegarder les transactions
   */
  public setupAutoSave(): void {
    // Déclencher un événement de sauvegarde toutes les 5 minutes
    setInterval(() => {
      const event = new CustomEvent('auto-save-transactions');
      window.dispatchEvent(event);
      console.log('Sauvegarde automatique des transactions déclenchée');
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Sauvegarde manuelle des transactions
   * Cette fonction peut être appelée pour forcer la sauvegarde des transactions
   */
  public saveTransactions(transactions: Transaction[]): void {
    this.saveTransactionsToFile(transactions);
  }
}

export const fileService = FileService.getInstance();
