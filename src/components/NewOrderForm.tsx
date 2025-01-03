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
import { Plus, Trash2 } from 'lucide-react';

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

    onSubmit({
      name: orderName,
      description: orderDescription,
      products: combinedProducts,
      status: editingOrder?.status || 'pendente'
    });

    setOrderName('');
    setOrderDescription('');
    setOrderProducts([]);
    toast.success(editingOrder ? 'Encomenda atualizada com sucesso' : 'Encomenda criada com sucesso');
  };

  const sortedProducts = products
    .sort((a, b) => a.name.localeCompare(b.name));

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
          <div key={index} className="flex gap-4">
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
                    {product.name} - €{product.price.toFixed(2)} - Stock: {product.quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min="1"
              value={orderProduct.quantity}
              onChange={(e) => {
                const newProducts = [...orderProducts];
                newProducts[index].quantity = parseInt(e.target.value) || 1;
                setOrderProducts(newProducts);
              }}
              className="w-24"
            />

            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleRemoveProduct(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
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

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
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