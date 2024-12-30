import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Order, Product } from '@/types';
import OrderList from '@/components/OrderList';
import ProductManagement from '@/components/ProductManagement';
import NewOrderForm from '@/components/NewOrderForm';
import { ClipboardList, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getOrders, updateOrder, deleteOrder, createOrder, updateOrderProductStatus } from '@/services/database';

interface OrderListProps {
  onProductCheck: (orderId: string, productId: string, checked: boolean) => void;
  checkedProducts: {[key: string]: boolean};
}

const Index = () => {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [showProducts, setShowProducts] = React.useState(false);
  const [showNewOrder, setShowNewOrder] = React.useState(false);
  const [editingOrder, setEditingOrder] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const [checkedProducts, setCheckedProducts] = useState<{[key: string]: boolean}>({});

  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Encomenda criada com sucesso');
      setShowNewOrder(false);
      setEditingOrder(null);
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

  const handleDeleteOrder = (orderId: string) => {
    deleteOrderMutation.mutate(orderId);
  };

  const handleCreateOrder = (newOrder: Omit<Order, 'id'>) => {
    if (editingOrder) {
      updateOrderMutation.mutate({
        id: editingOrder,
        order: newOrder,
      }, {
        onSuccess: () => {
          setEditingOrder(null);
          setShowNewOrder(false);
        }
      });
    } else {
      createOrderMutation.mutate(newOrder, {
        onSuccess: () => {
          setShowNewOrder(false);
        }
      });
    }
  };

  const handleProductCheck = (orderId: string, productId: string, checked: boolean) => {
    updateProductStatusMutation.mutate({ orderId, productId, completed: checked });
  };

  const handleCancelOrder = () => {
    setShowNewOrder(false);
    setEditingOrder(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Encomendas</h1>
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
            onProductsChange={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
          />
        </div>
      ) : (
        <>
          {!showCompleted && (
            <div className="bg-card p-4 rounded-lg mb-8">
              <div className="text-2xl font-semibold">
                Total: €{orders
                  .filter(order => order.status !== 'concluida')
                  .reduce((total, order) => {
                    return total + order.products.reduce((orderTotal, orderProduct) => {
                      const product = products.find(p => p.id === orderProduct.productId);
                      return orderTotal + (product ? product.price * orderProduct.quantity : 0);
                    }, 0);
                  }, 0)
                  .toFixed(2)}
              </div>
            </div>
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

          {!showCompleted && (
            <div className="mt-8">
              {showNewOrder ? (
                <NewOrderForm
                  products={products}
                  onSubmit={handleCreateOrder}
                  editingOrder={editingOrder ? orders.find(o => o.id === editingOrder) : undefined}
                  onCancel={handleCancelOrder}
                />
              ) : (
                <Button
                  onClick={() => setShowNewOrder(true)}
                  className="mx-auto block"
                >
                  Nova Encomenda
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Index;