
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CampaignData {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  prize_description?: string;
  prizes?: any[];
}

const CampaignConfig = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !id) {
      navigate('/dashboard');
      return;
    }
    loadCampaign();
  }, [user, id, navigate]);

  const loadCampaign = async () => {
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_prizes(*)
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (campaignError) throw campaignError;

      if (!campaign) {
        toast({
          title: 'Campanha não encontrada',
          description: 'Redirecionando para o dashboard',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setCampaign({
        ...campaign,
        prizes: campaign.campaign_prizes || []
      });
      setDescription(campaign.description || '');
      setRules(campaign.rules || '');
      setPrizeDescription(campaign.prize_description || '');
    } catch (error: any) {
      console.error('Error loading campaign:', error);
      toast({
        title: 'Erro ao carregar campanha',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!campaign) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          description,
          rules,
          prize_description: prizeDescription
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Configurações salvas',
        description: 'As informações da campanha foram atualizadas',
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving campaign config:', error);
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-blue"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campanha não encontrada</h1>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-xl font-bold">Configurar Campanha</h1>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Campanha: {campaign.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Campanha</Label>
              <Textarea
                id="description"
                placeholder="Descreva sua campanha de forma atrativa para os participantes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Regras da Campanha</Label>
              <Textarea
                id="rules"
                placeholder="• Cada participante pode girar apenas uma vez
• Válido até dd/mm/aaaa
• Prêmios sujeitos a disponibilidade..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizeDescription">Descrição dos Prêmios</Label>
              <Textarea
                id="prizeDescription"
                placeholder="Descreva os prêmios disponíveis, como resgatar, validade dos cupons, etc..."
                value={prizeDescription}
                onChange={(e) => setPrizeDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Prêmios Configurados:</h3>
              <div className="space-y-2">
                {campaign.prizes && campaign.prizes.length > 0 ? (
                  campaign.prizes.map((prize, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{prize.name}</span>
                      <span className="text-sm text-gray-500">{prize.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Nenhum prêmio configurado</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CampaignConfig;
