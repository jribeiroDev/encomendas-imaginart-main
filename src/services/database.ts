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
    .select(`
      *,
      order_products (
        product_id,
        quantity
      )
    `);
  
  if (ordersError) throw ordersError;

  // Transform the data to match our Order type
  return (orders || []).map(order => ({
    id: order.id,
    name: order.name,
    description: order.description,
    status: order.status,
    products: order.order_products.map((op: any) => ({
      productId: op.product_id,
      quantity: op.quantity
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