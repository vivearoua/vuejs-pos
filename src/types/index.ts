export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'cashier';
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  last_login: string;
}

export interface Phone {
  id: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  price: number;
  stock: number;
  imei_prefix: string;
  warranty_months: number;
  added_date: string;
}

export interface Accessory {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  type: string;
  compatible_with: string[];
  added_date: string;
}

export interface Repair {
  id: string;
  phone_id: string;
  customer_name: string;
  customer_phone: string;
  issue: string;
  cost: number;
  parts_used: string[];
  status: 'Pending' | 'In Progress' | 'Completed';
  start_date: string;
  estimated_completion?: string;
  completed_date?: string;
}

export interface TransactionItem {
  item_type: 'phone' | 'accessory';
  item_id: string;
  quantity: number;
  unit_price: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'sale' | 'repair';
  items?: TransactionItem[];
  repair_id?: string;
  total_amount: number;
  discount: number;
  payment_method: string;
  timestamp: string;
  customer_name: string;
}

export interface Stats {
  total_sales: {
    amount: number;
    count: number;
    last_updated: string;
  };
  total_repairs: {
    amount: number;
    count: number;
    last_updated: string;
  };
  inventory: {
    phones_in_stock: number;
    accessories_in_stock: number;
    last_updated: string;
  };
  top_selling_products: Array<{
    item_id: string;
    item_type: string;
    units_sold: number;
    total_revenue: number;
  }>;
  repair_status_summary: {
    pending: number;
    in_progress: number;
    completed: number;
    last_updated: string;
  };
}