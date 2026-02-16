import { useState } from 'react';
import { useAnalyzeDeal, useCreateDealFromAnalysis } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus } from 'lucide-react';
import AnalysisResultCard from '../components/AnalysisResultCard';
import { toast } from 'sonner';

export default function DealAnalyzerPage() {
  const [address, setAddress] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const analyzeDeal = useAnalyzeDeal();
  const createDeal = useCreateDealFromAnalysis();

  const handleAnalyze = () => {
    if (!address.trim()) {
      toast.error('Please enter a property address');
      return;
    }
    analyzeDeal.mutate(address.trim());
  };

  const handleAddToPipeline = () => {
    if (!analyzeDeal.data) return;
    if (!sellerName.trim()) {
      toast.error('Please enter seller name');
      return;
    }

    createDeal.mutate(
      {
        analysis: analyzeDeal.data,
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Deal added to pipeline!');
          setAddress('');
          setSellerName('');
          setSellerPhone('');
          analyzeDeal.reset();
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI One-Click Deal Analyzer</h1>
        <p className="text-muted-foreground">Analyze deals instantly with AI-powered insights</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Property Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State ZIP"
              disabled={analyzeDeal.isPending}
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzeDeal.isPending || !address.trim()}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {analyzeDeal.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Deal
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analyzeDeal.isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">
              Failed to analyze deal. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {analyzeDeal.data && (
        <>
          <AnalysisResultCard analysis={analyzeDeal.data} />

          <Card>
            <CardHeader>
              <CardTitle>Add to Deals Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sellerName">Seller Name *</Label>
                  <Input
                    id="sellerName"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerPhone">Seller Phone</Label>
                  <Input
                    id="sellerPhone"
                    type="tel"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddToPipeline}
                disabled={createDeal.isPending || !sellerName.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {createDeal.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Deals Pipeline
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

