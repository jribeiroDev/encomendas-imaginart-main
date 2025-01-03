import React, { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFinancialValues, updateFinancialValues } from "@/services/database";

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
  const queryClient = useQueryClient();
  const [isEditingBanco, setIsEditingBanco] = useState(false);
  const [isEditingCasa, setIsEditingCasa] = useState(false);
  const [tempBancoValue, setTempBancoValue] = useState<string>('0');
  const [tempCasaValue, setTempCasaValue] = useState<string>('0');

  // Query for financial values
  const { data: financialValues } = useQuery({
    queryKey: ['financialValues'],
    queryFn: getFinancialValues,
    initialData: { banco: 0, casa: 0 }
  });

  // Mutation for updating financial values
  const updateFinancialMutation = useMutation({
    mutationFn: updateFinancialValues,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialValues'] });
      toast.success('Valores atualizados com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar valores');
    }
  });

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
      if (!product) return total;
      return total + (product.price * orderProduct.quantity);
    }, 0);
  };

  const calculatePaidTotal = (order: Order) => {
    if (order.status === 'concluida') {
      return calculateOrderTotal(order);
    }

    return order.products.reduce((total, orderProduct) => {
      const product = products.find(p => p.id === orderProduct.productId);
      if (!product || !orderProduct.completed) return total;
      return total + (product.price * orderProduct.quantity);
    }, 0);
  };

  const calculateRemainingTotal = (order: Order) => {
    const total = calculateOrderTotal(order);
    const paid = calculatePaidTotal(order);
    return total - paid;
  };

  // Calculate grand totals including manual values
  const grandTotal = orders.reduce((sum, order) => sum + calculateOrderTotal(order), 0) + 
    (financialValues?.banco || 0) + (financialValues?.casa || 0);
  const grandPaidTotal = orders.reduce((sum, order) => sum + calculatePaidTotal(order), 0);
  const grandRemainingTotal = orders.reduce((sum, order) => sum + calculateRemainingTotal(order), 0);

  const handleSaveBanco = () => {
    const value = parseFloat(tempBancoValue);
    if (isNaN(value)) {
      toast.error('Por favor, insira um valor válido');
      return;
    }
    updateFinancialMutation.mutate({
      id: financialValues.id,
      banco: value,
      casa: financialValues.casa
    });
    setIsEditingBanco(false);
  };

  const handleSaveCasa = () => {
    const value = parseFloat(tempCasaValue);
    if (isNaN(value)) {
      toast.error('Por favor, insira um valor válido');
      return;
    }
    updateFinancialMutation.mutate({
      id: financialValues.id,
      banco: financialValues.banco,
      casa: value
    });
    setIsEditingCasa(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted">
        <div className="space-y-2">
          <div className="font-medium">Resumo de Valores:</div>
          <div className="text-sm text-muted-foreground space-y-2">
            <div>Valor Total: €{grandTotal.toFixed(2)}</div>
            <div>Valor Pago: €{grandPaidTotal.toFixed(2)}</div>
            <div>Valor em Falta: €{grandRemainingTotal.toFixed(2)}</div>
            
            <div className="flex items-center gap-2">
              <div>Valor Banco:</div>
              {isEditingBanco ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tempBancoValue}
                    onChange={(e) => setTempBancoValue(e.target.value)}
                    className="w-32"
                    step="0.01"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSaveBanco}
                    disabled={updateFinancialMutation.isPending}
                  >
                    {updateFinancialMutation.isPending ? 'A guardar...' : 'Guardar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingBanco(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>€{financialValues.banco.toFixed(2)}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setTempBancoValue(financialValues.banco.toString());
                      setIsEditingBanco(true);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div>Valor Casa:</div>
              {isEditingCasa ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tempCasaValue}
                    onChange={(e) => setTempCasaValue(e.target.value)}
                    className="w-32"
                    step="0.01"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSaveCasa}
                    disabled={updateFinancialMutation.isPending}
                  >
                    {updateFinancialMutation.isPending ? 'A guardar...' : 'Guardar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingCasa(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>€{financialValues.casa.toFixed(2)}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setTempCasaValue(financialValues.casa.toString());
                      setIsEditingCasa(true);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

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
                  const isCompleted = order.status === 'concluida' || orderProduct.completed;
                  
                  return product ? (
                    <div key={`${order.id}-${orderProduct.productId}`} 
                         className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox 
                        id={`${order.id}-${orderProduct.productId}`}
                        checked={isCompleted}
                        disabled={order.status === 'concluida'}
                        onCheckedChange={(checked) => 
                          onProductCheck(order.id, orderProduct.productId, checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={`${order.id}-${orderProduct.productId}`}
                        className={cn(
                          "flex-1",
                          isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {orderProduct.quantity}x {product.name} - €{(product.price * orderProduct.quantity).toFixed(2)}
                        {isCompleted && " (pago)"}
                      </label>
                    </div>
                  ) : null;
                })}
              </div>
              <div className="mt-2 space-y-1">
                <div className="font-medium">Total: €{calculateOrderTotal(order).toFixed(2)}</div>
                {(calculatePaidTotal(order) > 0 || order.status === 'concluida') && (
                  <div className="text-sm text-muted-foreground">
                    <div>Pago: €{calculatePaidTotal(order).toFixed(2)}</div>
                    {order.status !== 'concluida' && (
                      <div>Em falta: €{calculateRemainingTotal(order).toFixed(2)}</div>
                    )}
                  </div>
                )}
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