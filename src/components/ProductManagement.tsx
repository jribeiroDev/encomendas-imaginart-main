import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Product } from '@/types';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, deleteProduct, updateProduct } from '@/services/database';

interface ProductManagementProps {
  products: Product[];
  onProductsChange: () => void;
}

const ProductManagement = ({ products, onProductsChange }: ProductManagementProps) => {
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onProductsChange();
      setNewProductName('');
      setNewProductPrice('');
      setNewProductQuantity('');
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

  const updateProductMutation = useMutation({
    mutationFn: (product: Product) => updateProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onProductsChange();
      setEditingProduct(null);
      toast.success('Produto atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar produto');
      console.error('Error updating product:', error);
    },
  });

  const handleAddProduct = () => {
    if (!newProductName || !newProductPrice || !newProductQuantity) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const price = parseFloat(newProductPrice);
    const quantity = parseInt(newProductQuantity);
    
    if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity < 0) {
      toast.error('Por favor, insira valores válidos');
      return;
    }

    createProductMutation.mutate({
      name: newProductName,
      price: price,
      quantity: quantity,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProductName(product.name);
    setNewProductPrice(product.price.toString());
    setNewProductQuantity(product.quantity?.toString() || '0');
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;

    const price = parseFloat(newProductPrice);
    const quantity = parseInt(newProductQuantity);
    
    if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity < 0) {
      toast.error('Por favor, insira valores válidos');
      return;
    }

    updateProductMutation.mutate({
      ...editingProduct,
      name: newProductName,
      price: price,
      quantity: quantity,
    });
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
            placeholder="Nome"
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
          <Input
            type="number"
            min="0"
            placeholder="Quantidade"
            value={newProductQuantity}
            onChange={(e) => setNewProductQuantity(e.target.value)}
          />
          <Button onClick={editingProduct ? handleUpdateProduct : handleAddProduct}>
            <Plus className="w-4 h-4 mr-2" />
            {editingProduct ? 'Atualizar' : 'Adicionar'}
          </Button>
          {editingProduct && (
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Cancelar
            </Button>
          )}
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
              <span className="ml-4 text-muted-foreground">
                Qtd: {product.quantity || 0}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEditProduct(product)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDeleteProduct(product.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
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