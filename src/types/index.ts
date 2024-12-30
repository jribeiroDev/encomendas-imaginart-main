export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface OrderProduct {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  name: string;
  description?: string;
  products: OrderProduct[];
  status: 'pendente' | 'iniciada' | 'concluida';
}