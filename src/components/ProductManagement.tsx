import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Product } from '@/types';
import { Plus, Trash2, Pencil, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, deleteProduct, updateProduct } from '@/services/database';

interface ProductManagementProps {
  products: Product[];
  onProductsChange: () => void;
  onClose: () => void;
}

const ProductManagement = ({ products, onProductsChange, onClose }: ProductManagementProps) => {
  // Separate states for add form
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState('');

  // Separate states for edit form
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductQuantity, setEditProductQuantity] = useState('');

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
      setEditingProductId(null);
      setEditProductName('');
      setEditProductPrice('');
      setEditProductQuantity('');
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

  const handleEditClick = (product: Product) => {
    if (editingProductId === product.id) {
      setEditingProductId(null);
      setEditProductName('');
      setEditProductPrice('');
      setEditProductQuantity('');
    } else {
      setEditingProductId(product.id);
      setEditProductName(product.name);
      setEditProductPrice(product.price.toString());
      setEditProductQuantity(product.quantity.toString());
    }
  };

  const handleUpdateProduct = (productId: string) => {
    const price = parseFloat(editProductPrice);
    const quantity = parseInt(editProductQuantity);
    
    if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity < 0) {
      toast.error('Por favor, insira valores válidos');
      return;
    }

    updateProductMutation.mutate({
      id: productId,
      name: editProductName,
      price: price,
      quantity: quantity,
    });
  };

  // Sort products alphabetically
  const sortedProducts = products?.sort((a, b) => 
    a.name.localeCompare(b.name)
  ) || [];

  return (
    <div className="space-y-4">
      {/* Add Product Form */}
      <Card className="p-4">
        <div className="space-y-4">
          <Input
            placeholder="Nome do produto"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Preço"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
              />
              <div className="absolute right-0 top-0 h-full flex flex-col border-l">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-1/2 px-2"
                  onClick={() => setNewProductPrice(((parseFloat(newProductPrice) || 0) + 0.10).toFixed(2))}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-1/2 px-2 border-t"
                  onClick={() => setNewProductPrice(Math.max(0, (parseFloat(newProductPrice) || 0) - 0.10).toFixed(2))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative flex-1">
              <Input
                type="number"
                min="0"
                placeholder="Quantidade"
                value={newProductQuantity}
                onChange={(e) => setNewProductQuantity(e.target.value)}
              />
              <div className="absolute right-0 top-0 h-full flex flex-col border-l">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-1/2 px-2"
                  onClick={() => setNewProductQuantity(((parseInt(newProductQuantity) || 0) + 1).toString())}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-1/2 px-2 border-t"
                  onClick={() => setNewProductQuantity(Math.max(0, (parseInt(newProductQuantity) || 0) - 1).toString())}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              className="w-[120px]"
              onClick={handleAddProduct}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Card>

      {/* Product List */}
      {sortedProducts.map((product) => (
        <Card key={product.id} className="p-4">
          <div className="flex justify-between items-center gap-2">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                €{product.price.toFixed(2)} - Stock: {product.quantity}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10 p-0 border-gray-200"
                onClick={() => handleEditClick(product)}
              >
                <Pencil className="h-4 w-4 hover:text-black" />
              </Button>
              <Button 
                variant="outline"
                size="icon"
                className="h-10 w-10 p-0 border-gray-200"
                onClick={() => deleteProductMutation.mutate(product.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
              </Button>
            </div>
          </div>

          {editingProductId === product.id && (
            <div className="mt-4 border-t pt-4">
              <div className="space-y-4">
                <Input
                  placeholder="Nome do produto"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Preço"
                      value={editProductPrice}
                      onChange={(e) => setEditProductPrice(e.target.value)}
                    />
                    <div className="absolute right-0 top-0 h-full flex flex-col border-l">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-1/2 px-2"
                        onClick={() => setEditProductPrice(((parseFloat(editProductPrice) || 0) + 0.10).toFixed(2))}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-1/2 px-2 border-t"
                        onClick={() => setEditProductPrice(Math.max(0, (parseFloat(editProductPrice) || 0) - 0.10).toFixed(2))}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Quantidade"
                      value={editProductQuantity}
                      onChange={(e) => setEditProductQuantity(e.target.value)}
                    />
                    <div className="absolute right-0 top-0 h-full flex flex-col border-l">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-1/2 px-2"
                        onClick={() => setEditProductQuantity(((parseInt(editProductQuantity) || 0) + 1).toString())}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-1/2 px-2 border-t"
                        onClick={() => setEditProductQuantity(Math.max(0, (parseInt(editProductQuantity) || 0) - 1).toString())}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    className="w-[120px]"
                    onClick={() => handleUpdateProduct(product.id)}
                  >
                    Atualizar
                  </Button>
                  {editingProductId === product.id && (
                    <Button 
                      variant="outline" 
                      className="w-[120px]"
                      onClick={() => {
                        setEditingProductId(null);
                        setEditProductName('');
                        setEditProductPrice('');
                        setEditProductQuantity('');
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ProductManagement;