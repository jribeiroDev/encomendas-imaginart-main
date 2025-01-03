import { supabase } from '@/lib/supabase';
import { Product, Order } from '@/types';

// Products
export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) throw error;
  return data as Product[];
};

export const createProduct = async (product: Omit<Product, 'id'>) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data as Product;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Orders
export const getOrders = async () => {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*');

  if (ordersError) throw ordersError;

  const { data: orderProducts, error: productsError } = await supabase
    .from('order_products')
    .select('*');

  if (productsError) throw productsError;

  return orders.map(order => ({
    ...order,
    products: orderProducts
      .filter(op => op.order_id === order.id)
      .map(op => ({
        productId: op.product_id,
        quantity: op.quantity,
        completed: op.completed || false
      }))
  })) as Order[];
};

export const createOrder = async (order: Omit<Order, 'id'>) => {
  // Start a Supabase transaction
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      name: order.name,
      description: order.description,
      status: order.status
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order products
  const orderProducts = order.products.map(product => ({
    order_id: newOrder.id,
    product_id: product.productId,
    quantity: product.quantity
  }));

  const { error: productsError } = await supabase
    .from('order_products')
    .insert(orderProducts);

  if (productsError) {
    // If there's an error inserting products, we should delete the order
    await supabase
      .from('orders')
      .delete()
      .eq('id', newOrder.id);
    throw productsError;
  }

  // Return the complete order
  return {
    ...newOrder,
    products: order.products
  } as Order;
};

export const updateOrder = async (id: string, order: Partial<Order>) => {
  const { data, error: orderError } = await supabase
    .from('orders')
    .update({
      name: order.name,
      description: order.description,
      status: order.status
    })
    .eq('id', id)
    .select()
    .single();

  if (orderError) throw orderError;

  if (order.products) {
    // Delete existing order products
    const { error: deleteError } = await supabase
      .from('order_products')
      .delete()
      .eq('order_id', id);

    if (deleteError) throw deleteError;

    // Insert new order products
    const orderProducts = order.products.map(product => ({
      order_id: id,
      product_id: product.productId,
      quantity: product.quantity
    }));

    const { error: productsError } = await supabase
      .from('order_products')
      .insert(orderProducts);

    if (productsError) throw productsError;
  }

  return {
    ...data,
    products: order.products || []
  } as Order;
};

export const deleteOrder = async (id: string) => {
  // The order_products will be automatically deleted due to ON DELETE CASCADE
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const updateOrderProductStatus = async (
  orderId: string,
  productId: string,
  completed: boolean
) => {
  const { error } = await supabase
    .from('order_products')
    .update({ completed })
    .match({ order_id: orderId, product_id: productId });

  if (error) throw error;
};

// Add new interface for financial values
export interface FinancialValues {
  id?: string;
  banco: number;
  casa: number;
}

// Add functions to get and update financial values
export const getFinancialValues = async (): Promise<FinancialValues> => {
  const { data, error } = await supabase
    .from('financial_values')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found, create default values
      return createFinancialValues({ banco: 0, casa: 0 });
    }
    throw error;
  }

  return data;
};

export const createFinancialValues = async (values: Omit<FinancialValues, 'id'>): Promise<FinancialValues> => {
  const { data, error } = await supabase
    .from('financial_values')
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateFinancialValues = async (values: Partial<FinancialValues>): Promise<FinancialValues> => {
  const { data, error } = await supabase
    .from('financial_values')
    .update(values)
    .eq('id', values.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Add login function
export const loginUser = async (username: string, password: string) => {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error) throw error;
  return data;
};