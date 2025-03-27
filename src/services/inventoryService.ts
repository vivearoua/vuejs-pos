interface BaseProduct {
  id: string;
  price: number;
  stock: number;
  minStock?: number;
  lastUpdated: string;
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
      'minStock'
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
}

export const inventoryService = InventoryService.getInstance();
