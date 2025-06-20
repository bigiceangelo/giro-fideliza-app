
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

interface CampaignData {
  id: string;
  name: string;
  config: {
    prizes: any[];
    collectDataBefore: boolean;
    thankYouMessage: string;
    wheelColor: string;
    customFields: any[];
    description?: string;
    rules?: string;
    prizeDescription?: string;
  };
}

const CampaignConfig = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const campaigns = localStorage.getItem('fidelizagiro_campaigns');
    if (campaigns) {
      const parsedCampaigns = JSON.parse(campaigns);
      const foundCampaign = parsedCampaigns.find((c: CampaignData) => c.id === id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
        setDescription(foundCampaign.config.description || '');
        setRules(foundCampaign.config.rules || '');
        setPrizeDescription(foundCampaign.config.prizeDescription || '');
      }
    }
  }, [id]);

  const handleSave = () => {
    if (!campaign) return;

    const campaigns = localStorage.getItem('fidelizagiro_campaigns');
    if (campaigns) {
      const parsedCampaigns = JSON.parse(campaigns);
      const updatedCampaigns = parsedCampaigns.map((c: CampaignData) => {
        if (c.id === id) {
          return {
            ...c,
            config: {
              ...c.config,
              description,
              rules,
              prizeDescription
            }
          };
        }
        return c;
      });

      localStorage.setItem('fidelizagiro_campaigns', JSON.stringify(updatedCampaigns));
      
      toast({
        title: 'Configurações salvas',
        description: 'As informações da campanha foram atualizadas',
      });
      
      navigate('/dashboard');
    }
  };

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
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
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
                {campaign.config.prizes.map((prize, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{prize.name}</span>
                    <span className="text-sm text-gray-500">{prize.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CampaignConfig;
