import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface LoginFormProps {
  onLogin: (success: boolean) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error) throw error;

      if (data) {
        onLogin(true);
        toast.success('Login efetuado com sucesso');
      } else {
        toast.error('Credenciais inválidas');
        onLogin(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Credenciais inválidas');
      onLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-2xl font-bold text-center mb-6">ImaginArte</h1>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'A entrar...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
} 