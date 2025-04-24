interface BaseProduct {
  id: string;
  price: number;
  stock: number;
  minStock?: number;
  lastUpdated: string;
  imageUrl?: string;
}

interface Phone extends BaseProduct {
  type: 'phone';
  brand: string;
  model: string;
  storage: string;
  color: string;
}

interface Accessory extends BaseProduct {
  type: 'accessory';
  name: string;
  brand: string;
  compatible_with: string[];
}

export type Product = Phone | Accessory;

interface StockMovement {
  id: string;
  date: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: 'sale' | 'return' | 'adjustment' | 'reception';
  reference?: string;
}

class InventoryService {
  private static instance: InventoryService;
  private products: Product[] = [];
  private movements: StockMovement[] = [];
  private subscribers: ((type: string, data: any) => void)[] = [];

  private constructor() {
    this.loadFromStorage();
    // Si aucun produit n'est chargé, initialiser avec les données de productsdb.json
    if (this.products.length === 0) {
      this.initializeFromProductsData();
    }
  }

  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  private loadFromStorage(): void {
    const savedProducts = localStorage.getItem('inventory_products');
    const savedMovements = localStorage.getItem('inventory_movements');

    if (savedProducts) {
      this.products = JSON.parse(savedProducts);
    }

    if (savedMovements) {
      this.movements = JSON.parse(savedMovements);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('inventory_products', JSON.stringify(this.products));
    localStorage.setItem('inventory_movements', JSON.stringify(this.movements));
    
    // Synchroniser avec le fichier productsdb.json
    this.updateProductsJson();
  }
  
  private updateProductsJson(): void {
    (async () => {
      try {
        // Charger le fichier productsdb.json
        const productsData = await import('../data/productsdb.json');
        const data = productsData.default || productsData;
        
        // Séparer les produits par type
        const phones: any[] = [];
        const accessories: any[] = [];
        
        this.products.forEach(product => {
          if (product.type === 'phone') {
            phones.push({
              id: product.id,
              brand: product.brand,
              model: product.model,
              storage: product.storage,
              color: product.color,
              price: product.price,
              stock: product.stock,
              added_date: product.lastUpdated,
              imageUrl: product.imageUrl || ''
            });
          } else if (product.type === 'accessory') {
            accessories.push({
              id: product.id,
              name: product.name,
              brand: product.brand,
              compatible_with: product.compatible_with,
              price: product.price,
              stock: product.stock,
              added_date: product.lastUpdated,
              imageUrl: product.imageUrl || ''
            });
          }
        });
        
        // Mettre à jour les données
        data.phones = phones;
        data.accessories = accessories;
        
        // Envoyer les données mises à jour au serveur
        fetch(`${import.meta.env.VITE_API_URL}/updateproducts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            data: {
              phones,
              accessories
            }
          }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to update productsdb.json');
          }
          return response.json();
        })
        .then(data => console.log('productsdb.json updated successfully:', data))
        .catch(error => console.error('Error updating productsdb.json:', error));
      } catch (error) {
        console.error('Error preparing data for productsdb.json update:', error);
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

  public addProduct(product: Omit<Product, 'id' | 'lastUpdated'>): Product {
    const newProduct = {
      ...product,
      id: `PRD-${Date.now()}`,
      lastUpdated: new Date().toISOString()
    } as Product;

    this.products.push(newProduct);
    this.saveToStorage();
    this.notify('product_added', newProduct);

    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'type'>>): Product {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const currentProduct = this.products[index];
    const updatedProduct = {
      ...currentProduct,
      ...updates,
      type: currentProduct.type, // Préserver le type original
      lastUpdated: new Date().toISOString()
    } as Product;

    this.products[index] = updatedProduct;
    this.saveToStorage();
    this.notify('product_updated', updatedProduct);

    return updatedProduct;
  }

  public deleteProduct(id: string): void {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const product = this.products[index];
    this.products.splice(index, 1);
    this.saveToStorage();
    this.notify('product_deleted', product);
  }

  public getProduct(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  public getAllProducts(): Product[] {
    return [...this.products];
  }

  public searchProducts(query: string): Product[] {
    const searchTerm = query.toLowerCase();
    return this.products.filter(product => {
      if (product.type === 'phone') {
        return (
          product.brand.toLowerCase().includes(searchTerm) ||
          product.model.toLowerCase().includes(searchTerm) ||
          product.storage.toLowerCase().includes(searchTerm) ||
          product.color.toLowerCase().includes(searchTerm)
        );
      } else {
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm) ||
          product.compatible_with.some(c => c.toLowerCase().includes(searchTerm))
        );
      }
    });
  }

  public addMovement(movement: Omit<StockMovement, 'id' | 'date'>): StockMovement {
    const product = this.getProduct(movement.productId);
    if (!product) throw new Error('Product not found');

    const newMovement: StockMovement = {
      ...movement,
      id: `MVM-${Date.now()}`,
      date: new Date().toISOString()
    };

    // Mettre à jour le stock
    const stockChange = movement.type === 'in' ? movement.quantity : -movement.quantity;
    this.updateProduct(product.id, {
      stock: product.stock + stockChange
    });

    this.movements.push(newMovement);
    this.saveToStorage();
    this.notify('movement_added', newMovement);

    // Vérifier le stock minimum
    if (product.minStock && product.stock <= product.minStock) {
      this.notify('low_stock', {
        product,
        currentStock: product.stock,
        minStock: product.minStock
      });
    }

    return newMovement;
  }

  public getMovements(productId?: string): StockMovement[] {
    if (productId) {
      return this.movements.filter(m => m.productId === productId);
    }
    return [...this.movements];
  }

  /**
   * Diminue le stock d'un produit et enregistre un mouvement de stock
   * @param productId ID du produit
   * @param quantity Quantité à retirer du stock
   * @param reason Raison du mouvement (par défaut 'sale')
   * @param reference Référence optionnelle (ex: ID de transaction)
   * @returns Le produit mis à jour ou undefined si le produit n'existe pas
   */
  public decreaseStock(productId: string, quantity: number, reason: 'sale' | 'return' | 'adjustment' = 'sale', reference?: string): Product | undefined {
    // Trouver le produit
    const product = this.getProduct(productId);
    if (!product) {
      console.error(`Produit non trouvé: ${productId}`);
      return undefined;
    }

    // Vérifier que la quantité est positive
    if (quantity <= 0) {
      console.error(`Quantité invalide: ${quantity}`);
      return product;
    }

    // Vérifier que le stock est suffisant
    if (product.stock < quantity) {
      console.error(`Stock insuffisant: ${product.stock} < ${quantity}`);
      // On met à jour quand même mais avec le stock disponible
      quantity = product.stock;
    }

    // Mettre à jour le stock
    const updatedProduct = this.updateProduct(productId, {
      stock: Math.max(0, product.stock - quantity),
      lastUpdated: new Date().toISOString()
    });

    // Enregistrer le mouvement de stock
    this.addMovement({
      productId,
      type: 'out',
      quantity,
      reason,
      reference
    });

    // Notifier que le stock a été mis à jour
    this.notify('stock_decreased', {
      product: updatedProduct,
      quantity,
      reason,
      reference
    });

    return updatedProduct;
  }

  public getStockStatus(): {
    totalProducts: number;
    lowStock: Product[];
    outOfStock: Product[];
    totalValue: number;
  } {
    const lowStock: Product[] = [];
    const outOfStock: Product[] = [];
    let totalValue = 0;

    this.products.forEach(product => {
      totalValue += product.price * product.stock;

      if (product.stock === 0) {
        outOfStock.push(product);
      } else if (product.minStock && product.stock <= product.minStock) {
        lowStock.push(product);
      }
    });

    return {
      totalProducts: this.products.length,
      lowStock,
      outOfStock,
      totalValue
    };
  }

  public async importFromCSV(file: File): Promise<void> {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',');

    const products: Omit<Product, 'id' | 'lastUpdated'>[] = lines
      .slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        const product: any = {};

        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          if (header === 'compatible_with') {
            product[header] = value ? value.split(';') : [];
          } else if (header === 'price' || header === 'stock' || header === 'minStock') {
            product[header] = parseFloat(value) || 0;
          } else {
            product[header] = value;
          }
        });

        return product;
      });

    products.forEach(product => {
      this.addProduct(product);
    });
  }

  public exportToCSV(): string {
    const headers = [
      'type',
      'brand',
      'model',
      'storage',
      'color',
      'name',
      'compatible_with',
      'price',
      'stock',
      'minStock',
      'imageUrl'
    ];

    const lines = [headers.join(',')];

    this.products.forEach(product => {
      const values = headers.map(header => {
        const value = product[header as keyof Product];
        if (header === 'compatible_with' && Array.isArray(value)) {
          return `"${value.join(';')}"`;
        }
        return value || '';
      });
      lines.push(values.join(','));
    });

    return lines.join('\n');
  }

  private async initializeFromProductsData(): Promise<void> {
    try {
      // Charger le fichier productsdb.json directement comme module
      const productsData = await import('../data/productsdb.json');
      const data = productsData.default || productsData;
      
      // Convertir les téléphones au format de notre application
      const phones: Product[] = data.phones.map((phone: any) => ({
        id: phone.id,
        type: 'phone',
        brand: phone.brand,
        model: phone.model,
        storage: phone.storage,
        color: phone.color,
        price: phone.price,
        stock: phone.stock,
        minStock: 5, // Valeur par défaut
        lastUpdated: phone.added_date,
        imageUrl: phone.imageUrl || '' // Ajout du support des images
      }));
      
      // Convertir les accessoires au format de notre application
      const accessories: Product[] = data.accessories.map((accessory: any) => ({
        id: accessory.id,
        type: 'accessory',
        name: accessory.name,
        brand: accessory.brand,
        price: accessory.price,
        stock: accessory.stock,
        minStock: 10, // Valeur par défaut
        compatible_with: accessory.compatible_with,
        lastUpdated: accessory.added_date,
        imageUrl: accessory.imageUrl || '' // Ajout du support des images
      }));
      
      // Combiner les produits et les sauvegarder
      this.products = [...phones, ...accessories];
      this.saveToStorage();
      console.log('Produits initialisés depuis productsdb.json:', this.products.length);
    } catch (error) {
      console.error('Erreur lors du chargement des données de productsdb.json:', error);
    }
  }
}

export const inventoryService = InventoryService.getInstance();
