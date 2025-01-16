import { supabase } from "@/lib/supabase";
import { Product, Order } from "@/types";

// Products
export const getProducts = async () => {
  const { data, error } = await supabase.from("products").select("*");

  if (error) throw error;
  return data as Product[];
};

export const createProduct = async (product: Omit<Product, "id">) => {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      max_quantity: product.quantity, // Store initial quantity as max
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProduct = async (product: Product) => {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      max_quantity: product.quantity, // Update max when quantity is updated
    })
    .eq("id", product.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw error;
};

// Orders
export const getOrders = async () => {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*");

  if (ordersError) throw ordersError;

  const { data: orderProducts, error: productsError } = await supabase
    .from("order_products")
    .select("*");

  if (productsError) throw productsError;

  return orders.map((order) => ({
    ...order,
    products: orderProducts
      .filter((op) => op.order_id === order.id)
      .map((op) => ({
        productId: op.product_id,
        quantity: op.quantity,
        completed: op.completed || false,
      })),
  })) as Order[];
};

export const createOrder = async (order: Omit<Order, "id">) => {
  try {
    // Create the order first
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        name: order.name,
        description: order.description,
        status: order.status,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Update product quantities and create order_products
    for (const orderProduct of order.products) {
      // Get current product
      const { data: product } = await supabase
        .from("products")
        .select("quantity")
        .eq("id", orderProduct.productId)
        .single();

      if (product) {
        // Calculate new quantity, ensuring it doesn't go below 0
        const newQuantity = Math.max(
          0,
          product.quantity - orderProduct.quantity
        );

        // Update product with new quantity
        await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .eq("id", orderProduct.productId)
          .select()
          .single();

        // Create order_product entry
        await supabase.from("order_products").insert({
          order_id: newOrder.id,
          product_id: orderProduct.productId,
          quantity: orderProduct.quantity,
        });
      }
    }

    return {
      ...newOrder,
      products: order.products,
    } as Order;
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
};

export const updateOrder = async (id: string, order: Partial<Order>) => {
  try {
    // Get original order products first
    const { data: originalOrder } = await supabase
      .from("orders")
      .select(
        `
        status,
        order_products (
          product_id,
          quantity
        )
      `
      )
      .eq("id", id)
      .single();

    if (originalOrder) {
      // First restore quantities from original order if not completed
      if (originalOrder.status !== "concluida") {
        for (const oldProduct of originalOrder.order_products) {
          const { data: product } = await supabase
            .from("products")
            .select("quantity, max_quantity")
            .eq("id", oldProduct.product_id)
            .single();

          if (product) {
            // Restore quantity but don't exceed max_quantity
            const restoredQuantity = Math.min(
              product.max_quantity,
              product.quantity + oldProduct.quantity
            );

            await supabase
              .from("products")
              .update({ quantity: restoredQuantity })
              .eq("id", oldProduct.product_id);
          }
        }
      }
    }

    // Update the order details
    const { data: updatedOrder, error: orderError } = await supabase
      .from("orders")
      .update({
        name: order.name,
        description: order.description,
        status: order.status,
        // Do not include products here if it's not a direct column
      })
      .eq("id", id)
      .select()
      .single();

    if (orderError) throw orderError;

    // Handle new order products
    if (order.products) {
      // Delete old order_products
      await supabase.from("order_products").delete().eq("order_id", id);

      // Add new order_products and update quantities
      for (const newProduct of order.products) {
        const { data: product } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", newProduct.productId)
          .single();

        if (product) {
          // Update product quantity
          const newQuantity = Math.max(
            0,
            product.quantity - newProduct.quantity
          );
          await supabase
            .from("products")
            .update({ quantity: newQuantity })
            .eq("id", newProduct.productId);

          // Add new order_product
          await supabase.from("order_products").insert({
            order_id: id,
            product_id: newProduct.productId,
            quantity: newProduct.quantity,
          });
        }
      }
    }

    return {
      ...updatedOrder,
      products: order.products || [],
    } as Order;
  } catch (error) {
    console.error("Error in updateOrder:", error);
    throw error;
  }
};

export const deleteOrder = async (id: string) => {
  try {
    const { data: orderData } = await supabase
      .from("orders")
      .select(
        `
        status,
        order_products (
          product_id,
          quantity
        )
      `
      )
      .eq("id", id)
      .single();

    if (orderData && orderData.status !== "concluida") {
      for (const orderProduct of orderData.order_products) {
        // Get product with max_quantity
        const { data: product } = await supabase
          .from("products")
          .select("quantity, max_quantity")
          .eq("id", orderProduct.product_id)
          .single();

        if (product) {
          // Restore quantity but don't exceed max_quantity
          const newQuantity = Math.min(
            product.max_quantity,
            product.quantity + orderProduct.quantity
          );

          await supabase
            .from("products")
            .update({ quantity: newQuantity })
            .eq("id", orderProduct.product_id);
        }
      }
    }

    await supabase.from("orders").delete().eq("id", id);
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    throw error;
  }
};

export const updateOrderProductStatus = async (
  orderId: string,
  productId: string,
  completed: boolean
) => {
  const { error } = await supabase
    .from("order_products")
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
    .from("financial_values")
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No record found, create default values
      return createFinancialValues({ banco: 0, casa: 0 });
    }
    throw error;
  }

  return data;
};

export const createFinancialValues = async (
  values: Omit<FinancialValues, "id">
): Promise<FinancialValues> => {
  const { data, error } = await supabase
    .from("financial_values")
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateFinancialValues = async (
  values: Partial<FinancialValues>
): Promise<FinancialValues> => {
  const { data, error } = await supabase
    .from("financial_values")
    .update(values)
    .eq("id", values.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Add login function
export const loginUser = async (username: string, password: string) => {
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error) throw error;
  return data;
};
