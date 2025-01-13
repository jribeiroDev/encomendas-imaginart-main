export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderProduct {
  productId: string;
  quantity: number;
  completed?: boolean;
}

export interface Order {
  id: string;
  name: string;
  description?: string;
  products: OrderProduct[];
  status: 'pendente' | 'iniciada' | 'concluida' | 'falta_pagamento';
  completed_at: string;
}