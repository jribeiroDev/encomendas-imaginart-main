import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Product } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, deleteProduct } from '@/services/database';

interface ProductManagementProps {
  products: Product[];
  onProductsChange: () => void;
}

const ProductManagement = ({ products, onProductsChange }: ProductManagementProps) => {
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onProductsChange();
      setNewProductName('');
      setNewProductPrice('');
      toast.success('Produto criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar produto');
      console.error('Error creating product:', error);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onProductsChange();
      toast.success('Produto eliminado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar produto');
      console.error('Error deleting product:', error);
    },
  });

  const handleAddProduct = () => {
    if (!newProductName || !newProductPrice) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const price = parseFloat(newProductPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Por favor, insira um preço válido');
      return;
    }

    createProductMutation.mutate({
      name: newProductName,
      price: price,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  // Sort products alphabetically by name
  const sortedProducts = [...products].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Nome do produto"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Preço"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
          />
          <Button onClick={handleAddProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </Card>

      {sortedProducts.map((product) => (
        <Card key={product.id} className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">{product.name}</span>
              <span className="ml-4 text-muted-foreground">
                €{product.price.toFixed(2)}
              </span>
            </div>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDeleteProduct(product.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}

      {products.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          Sem produtos
        </div>
      )}
    </div>
  );
};

export default ProductManagement;