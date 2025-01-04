import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Order, Product } from '@/types';
import OrderList from '@/components/OrderList';
import ProductManagement from '@/components/ProductManagement';
import { ClipboardList, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getOrders, updateOrder, deleteOrder, createOrder, updateOrderProductStatus } from '@/services/database';
import LoginForm from '@/components/LoginForm';
import NewOrderForm from '@/components/NewOrderForm';

interface OrderListProps {
  onProductCheck: (orderId: string, productId: string, checked: boolean) => void;
  checkedProducts: {[key: string]: boolean};
}

const Index = () => {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [showProducts, setShowProducts] = React.useState(false);
  const [showNewOrder, setShowNewOrder] = React.useState(false);
  const [editingOrder, setEditingOrder] = React.useState<string | null>(null);
  const [checkedProducts, setCheckedProducts] = useState<{[key: string]: boolean}>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const queryClient = useQueryClient();

  // Queries - Add enabled flag
  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    enabled: isAuthenticated
  });

  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: isAuthenticated
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Encomenda criada com sucesso');
      setShowNewOrder(false);
      setEditingOrder(null);1
    },
    onError: (error) => {
      toast.error('Erro ao criar encomenda');
      console.error('Error creating order:', error);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, order }: { id: string; order: Partial<Order> }) =>
      updateOrder(id, order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Encomenda atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar encomenda');
      console.error('Error updating order:', error);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Encomenda eliminada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar encomenda');
      console.error('Error deleting order:', error);
    },
  });

  const updateProductStatusMutation = useMutation({
    mutationFn: ({ orderId, productId, completed }: { 
      orderId: string; 
      productId: string; 
      completed: boolean 
    }) => updateOrderProductStatus(orderId, productId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar estado do produto');
      console.error('Error updating product status:', error);
    },
  });

  const handleStatusChange = (orderId: string, status: 'pendente' | 'iniciada' | 'concluida') => {
    updateOrderMutation.mutate({ id: orderId, order: { status } });
  };

  const handleEditOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setEditingOrder(orderId);
      setShowNewOrder(true);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      
      // Force immediate refetch of both products and orders
      await Promise.all([
        refetchProducts(),
        refetchOrders(),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      ]);
      
      toast.success('Encomenda eliminada com sucesso');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao eliminar encomenda');
    }
  };

  const handleOrderSubmit = async (orderData: Omit<Order, 'id'> & { id?: string }) => {
    try {
      if (editingOrder && orderData.id) {
        // Update existing order
        await updateOrder(orderData.id, orderData);
        toast.success('Encomenda atualizada com sucesso!');
      } else {
        // Create new order
        await createOrder(orderData);
        toast.success('Encomenda criada com sucesso!');
      }
      
      // Refresh data
      await Promise.all([
        refetchOrders(),
        refetchProducts(),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] })
      ]);

      setShowNewOrder(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Erro ao salvar encomenda');
    }
  };

  const handleProductCheck = (orderId: string, productId: string, checked: boolean) => {
    updateProductStatusMutation.mutate({ orderId, productId, completed: checked });
  };

  const handleCancelOrder = () => {
    setShowNewOrder(false);
    setEditingOrder(null);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={setIsAuthenticated} />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Encomendas Imagin'Arte</h1>
        <div className="flex gap-4">
          {!showCompleted && (
            <Button
              variant="outline"
              onClick={() => {
                setShowProducts(!showProducts);
                setShowCompleted(false);
              }}
            >
              {showProducts ? (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Encomendas
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Gerir Produtos
                </>
              )}
            </Button>
          )}
          {!showProducts && (
            <Button
              variant="outline"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              {showCompleted ? 'Encomendas' : 'Encomendas Concluídas'}
            </Button>
          )}
        </div>
      </div>

      {showProducts ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Gerir Produtos</h2>
          <ProductManagement
            products={products}
            onProductsChange={refetchProducts}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowNewOrder(true)}>
              Nova Encomenda
            </Button>
          </div>

          {showNewOrder && (
            <NewOrderForm
              products={products}
              onSubmit={handleOrderSubmit}
              editingOrder={editingOrder ? orders.find(o => o.id === editingOrder) : undefined}
              onCancel={handleCancelOrder}
            />
          )}

          <OrderList
            orders={orders}
            products={products}
            onStatusChange={handleStatusChange}
            onEditOrder={handleEditOrder}
            onDeleteOrder={handleDeleteOrder}
            showCompleted={showCompleted}
            onProductCheck={handleProductCheck}
            checkedProducts={checkedProducts}
          />
        </>
      )}
    </div>
  );
};

export default Index;