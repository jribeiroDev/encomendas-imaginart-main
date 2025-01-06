import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { Order, Product } from '@/types';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface NewOrderFormProps {
  products: Product[];
  onSubmit: (order: Omit<Order, 'id'>) => void;
  editingOrder?: Order;
  onCancel: () => void;
}

const NewOrderForm = ({ products, onSubmit, editingOrder, onCancel }: NewOrderFormProps) => {
  const [orderName, setOrderName] = useState(editingOrder?.name || '');
  const [orderDescription, setOrderDescription] = useState(editingOrder?.description || '');
  const [orderProducts, setOrderProducts] = useState<{ productId: string; quantity: number }[]>(
    editingOrder?.products || []
  );

  const handleAddProduct = () => {
    setOrderProducts([...orderProducts, { productId: '', quantity: 1 }]);
  };

  const handleRemoveProduct = (index: number) => {
    setOrderProducts(orderProducts.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!orderName) {
      toast.error('Por favor, insira um nome para a encomenda');
      return;
    }

    if (orderProducts.length === 0) {
      toast.error('Por favor, adicione pelo menos um produto');
      return;
    }

    if (orderProducts.some(p => !p.productId)) {
      toast.error('Por favor, selecione produtos para todos os itens');
      return;
    }

    const combinedProducts = orderProducts.reduce<{ productId: string; quantity: number }[]>(
      (acc, current) => {
        const existingProduct = acc.find(p => p.productId === current.productId);
        if (existingProduct) {
          existingProduct.quantity += current.quantity;
          return acc;
        }
        return [...acc, { ...current }];
      },
      []
    );

    const orderData = {
      name: orderName,
      description: orderDescription,
      products: combinedProducts,
      status: editingOrder?.status || 'pendente',
      ...(editingOrder && { id: editingOrder.id })
    };

    onSubmit(orderData);
    onCancel();
  };

  const checkStock = (productId: string, requestedQuantity: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.quantity >= requestedQuantity : false;
  };

  const sortedProducts = products
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(p => ({
      ...p,
      displayName: `${p.name} - €${p.price.toFixed(2)} ${p.quantity === 0 ? '(Sem Stock)' : `- Stock: ${p.quantity}`}`
    }));

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <Input
          placeholder="Nome da encomenda"
          value={orderName}
          onChange={(e) => setOrderName(e.target.value)}
        />

        <Textarea
          placeholder="Descrição da encomenda"
          value={orderDescription}
          onChange={(e) => setOrderDescription(e.target.value)}
        />

        {orderProducts.map((orderProduct, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2">
            <Select
              value={orderProduct.productId}
              onValueChange={(value) => {
                const newProducts = [...orderProducts];
                newProducts[index].productId = value;
                setOrderProducts(newProducts);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {sortedProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <div className="relative w-24">
                <Input
                  type="number"
                  min="1"
                  value={orderProduct.quantity}
                  onChange={(e) => {
                    const newProducts = [...orderProducts];
                    newProducts[index].quantity = parseInt(e.target.value) || 1;
                    setOrderProducts(newProducts);
                  }}
                />
                <div className="absolute right-0 top-0 h-full flex flex-col border-l">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-1/2 px-2"
                    onClick={() => {
                      const newProducts = [...orderProducts];
                      newProducts[index].quantity = (parseInt(orderProduct.quantity.toString()) || 0) + 1;
                      setOrderProducts(newProducts);
                    }}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-1/2 px-2 border-t"
                    onClick={() => {
                      const newProducts = [...orderProducts];
                      newProducts[index].quantity = Math.max(1, (parseInt(orderProduct.quantity.toString()) || 1) - 1);
                      setOrderProducts(newProducts);
                    }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveProduct(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleAddProduct}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Produto
        </Button>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            className="w-full sm:w-auto"
            onClick={handleSubmit}
          >
            {editingOrder ? 'Atualizar' : 'Criar'} Encomenda
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NewOrderForm;