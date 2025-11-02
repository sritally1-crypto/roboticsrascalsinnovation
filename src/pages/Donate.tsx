import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, Globe, BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const donationSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least $1'),
  donor_name: z.string().min(1, 'Name is required').max(100),
  donor_email: z.string().email('Invalid email address').max(255),
  message: z.string().max(500, 'Message must be less than 500 characters').optional()
});

const Donate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    donor_name: '',
    donor_email: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      donationSchema.parse({
        amount: parseFloat(formData.amount),
        donor_name: formData.donor_name,
        donor_email: formData.donor_email,
        message: formData.message
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from('donations').insert({
      user_id: user?.id || null,
      amount: parseFloat(formData.amount),
      donor_name: formData.donor_name,
      donor_email: formData.donor_email,
      message: formData.message || null,
      status: 'completed'
    });

    setIsLoading(false);

    if (error) {
      toast.error('Failed to process donation');
    } else {
      toast.success('Thank you for your donation!');
      setFormData({ amount: '', donor_name: '', donor_email: '', message: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stone-light to-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-discovery-gold/20 to-accent/20">
              <Heart className="h-8 w-8 text-discovery-gold" />
            </div>
            <h1 className="text-4xl font-bold">Support Archaeology</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Help preserve and discover the world's cultural heritage for future generations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <Globe className="h-12 w-12 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Global Reach</h3>
            <p className="text-sm text-muted-foreground">
              Support excavations and research projects worldwide
            </p>
          </Card>
          <Card className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-accent" />
            <h3 className="font-semibold mb-2">Digital Preservation</h3>
            <p className="text-sm text-muted-foreground">
              Fund 3D scanning and digital archiving initiatives
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-discovery-gold" />
            <h3 className="font-semibold mb-2">Community Access</h3>
            <p className="text-sm text-muted-foreground">
              Make archaeological knowledge free and accessible to all
            </p>
          </Card>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Make a Donation</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Donation Amount (USD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="50.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="donor_name">Your Name *</Label>
                <Input
                  id="donor_name"
                  type="text"
                  placeholder="John Smith"
                  value={formData.donor_name}
                  onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                  required
                />
                {errors.donor_name && (
                  <p className="text-sm text-destructive">{errors.donor_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="donor_email">Email Address *</Label>
              <Input
                id="donor_email"
                type="email"
                placeholder="john@example.com"
                value={formData.donor_email}
                onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })}
                required
              />
              {errors.donor_email && (
                <p className="text-sm text-destructive">{errors.donor_email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Share why archaeology is important to you..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message}</p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                💡 This is a demonstration donation form. In a production environment, this would integrate 
                with payment processors like Stripe or PayPal to process actual payments securely.
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Complete Donation'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Donate;
