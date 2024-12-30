import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Order, Product } from '@/types';
import { Edit, Trash2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface OrderListProps {
  orders: Order[];
  products: Product[];
  onStatusChange: (orderId: string, status: 'pendente' | 'iniciada' | 'concluida') => void;
  onEditOrder: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  showCompleted?: boolean;
  onProductCheck: (orderId: string, productId: string, checked: boolean) => void;
  checkedProducts: {[key: string]: boolean};
}

const OrderList = ({ 
  orders, 
  products, 
  onStatusChange, 
  onEditOrder, 
  onDeleteOrder, 
  showCompleted = false,
  onProductCheck,
  checkedProducts 
}: OrderListProps) => {
  const filteredOrders = orders.filter(order => 
    showCompleted ? order.status === 'concluida' : order.status !== 'concluida'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-[#FDE1D3]';
      case 'iniciada':
        return 'bg-[#E3F5FF]';
      case 'concluida':
        return 'bg-[#F2FCE2]';
      default:
        return 'bg-gray-100';
    }
  };

  const calculateOrderTotal = (order: Order) => {
    return order.products.reduce((total, orderProduct) => {
      const product = products.find(p => p.id === orderProduct.productId);
      return total + (product ? product.price * orderProduct.quantity : 0);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {filteredOrders.map((order) => (
        <Card key={order.id} className="p-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-lg">{order.name}</h3>
              {order.description && (
                <p className="text-sm text-muted-foreground mt-1">{order.description}</p>
              )}
              <div className="mt-2 space-y-1">
                {order.products.map((orderProduct) => {
                  const product = products.find(p => p.id === orderProduct.productId);
                  return product ? (
                    <div key={`${order.id}-${orderProduct.productId}`} 
                         className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox 
                        id={`${order.id}-${orderProduct.productId}`}
                        checked={orderProduct.completed || false}
                        onCheckedChange={(checked) => 
                          onProductCheck(order.id, orderProduct.productId, checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={`${order.id}-${orderProduct.productId}`}
                        className={cn(
                          "flex-1",
                          orderProduct.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {orderProduct.quantity}x {product.name} - €{(product.price * orderProduct.quantity).toFixed(2)}
                      </label>
                    </div>
                  ) : null;
                })}
              </div>
              <div className="mt-2 font-medium">
                Total: €{calculateOrderTotal(order).toFixed(2)}
              </div>
            </div>
            <div className="flex flex-row sm:flex-col justify-end gap-2">
              <Select
                value={order.status}
                onValueChange={(value: 'pendente' | 'iniciada' | 'concluida') => onStatusChange(order.id, value)}
              >
                <SelectTrigger className={`w-[130px] ${getStatusColor(order.status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="iniciada">Iniciada</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => onEditOrder(order.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => onDeleteOrder(order.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      {filteredOrders.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          Sem encomendas {showCompleted ? 'concluídas' : 'ativas'}
        </div>
      )}
    </div>
  );
};

export default OrderList;