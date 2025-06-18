
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Share2, RotateCcw } from 'lucide-react';
import SpinWheel from '@/components/SpinWheel';

interface Prize {
  id: string;
  name: string;
  percentage: number;
  couponCode: string;
}

interface CampaignData {
  id: string;
  name: string;
  config: {
    prizes: Prize[];
    collectDataBefore: boolean;
    thankYouMessage: string;
    wheelColor: string;
  };
}

const Campaign = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [participantData, setParticipantData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [hasSpun, setHasSpun] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar dados da campanha
    const campaigns = localStorage.getItem('fidelizagiro_campaigns');
    if (campaigns) {
      const parsedCampaigns = JSON.parse(campaigns);
      const foundCampaign = parsedCampaigns.find((c: CampaignData) => c.id === id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
        setShowForm(foundCampaign.config.collectDataBefore);
      }
    }
  }, [id]);

  const saveParticipantData = () => {
    if (!isDataSaved && participantData.name && participantData.email && participantData.phone) {
      const participation = {
        campaignId: id,
        ...participantData,
        timestamp: new Date().toISOString(),
        hasSpun: false
      };
      
      const existingParticipations = localStorage.getItem('fidelizagiro_participations');
      const participations = existingParticipations ? JSON.parse(existingParticipations) : [];
      participations.push(participation);
      localStorage.setItem('fidelizagiro_participations', JSON.stringify(participations));
      setIsDataSaved(true);
      
      console.log('Dados do participante salvos:', participation);
    }
  };

  const handlePrizeWon = (prize: Prize) => {
    setWonPrize(prize);
    setHasSpun(true);
    setIsSpinning(false);
    
    // Atualizar participação com o prêmio ganho
    const existingParticipations = localStorage.getItem('fidelizagiro_participations');
    const participations = existingParticipations ? JSON.parse(existingParticipations) : [];
    
    // Encontrar a participação atual e atualizá-la
    const currentParticipationIndex = participations.findIndex(
      (p: any) => p.campaignId === id && p.email === participantData.email && !p.hasSpun
    );
    
    if (currentParticipationIndex >= 0) {
      participations[currentParticipationIndex] = {
        ...participations[currentParticipationIndex],
        prize: prize.name,
        couponCode: prize.couponCode,
        hasSpun: true,
        spinTimestamp: new Date().toISOString()
      };
    } else {
      // Se não encontrou, criar nova participação
      participations.push({
        campaignId: id,
        ...participantData,
        prize: prize.name,
        couponCode: prize.couponCode,
        hasSpun: true,
        timestamp: new Date().toISOString(),
        spinTimestamp: new Date().toISOString()
      });
    }
    
    localStorage.setItem('fidelizagiro_participations', JSON.stringify(participations));

    toast({
      title: 'Parabéns! 🎉',
      description: `Você ganhou: ${prize.name}`,
    });
  };

  const startSpin = () => {
    setIsSpinning(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se todos os campos estão preenchidos
    if (!participantData.name || !participantData.email || !participantData.phone) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive'
      });
      return;
    }

    // Salvar dados do participante
    saveParticipantData();
    
    if (campaign?.config.collectDataBefore) {
      setShowForm(false);
      toast({
        title: 'Dados salvos!',
        description: 'Agora você pode girar a roda da fortuna!',
      });
    } else {
      startSpin();
    }
  };

  const resetWheel = () => {
    setHasSpun(false);
    setWonPrize(null);
    setParticipantData({ name: '', email: '', phone: '' });
    setShowForm(campaign?.config.collectDataBefore || false);
    setIsDataSaved(false);
  };

  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'FidelizaGiro - Eu ganhei!',
        text: `Acabei de ganhar ${wonPrize?.name} na promoção ${campaign?.name}!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copiado!',
        description: 'O link da campanha foi copiado para a área de transferência',
      });
    }
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-lime-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campanha não encontrada</h1>
          <p className="text-gray-600">A campanha que você está procurando não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-lime-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-lime rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-brand-gold rounded-full"></div>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gradient">FidelizaGiro</h1>
            </div>
            <CardTitle className="text-xl">{campaign.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Formulário de Dados */}
            {showForm && !hasSpun && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={participantData.name}
                    onChange={(e) => setParticipantData({...participantData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={participantData.email}
                    onChange={(e) => setParticipantData({...participantData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={participantData.phone}
                    onChange={(e) => setParticipantData({...participantData, phone: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-brand-blue hover:bg-blue-600">
                  {campaign.config.collectDataBefore ? 'Continuar' : 'Girar a Roda!'}
                </Button>
              </form>
            )}

            {/* Roda da Fortuna */}
            {!showForm && !hasSpun && (
              <div className="text-center">
                <SpinWheel
                  prizes={campaign.config.prizes}
                  onSpin={handlePrizeWon}
                  isSpinning={isSpinning}
                  wheelColor={campaign.config.wheelColor}
                />
              </div>
            )}

            {/* Resultado */}
            {hasSpun && wonPrize && (
              <div className="text-center space-y-6">
                <div className="bg-gradient-to-br from-brand-gold to-yellow-500 p-6 rounded-xl text-white">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-xl font-bold mb-2">Parabéns!</h3>
                  <p className="text-lg">Você ganhou:</p>
                  <p className="text-2xl font-bold">{wonPrize.name}</p>
                </div>

                {wonPrize.couponCode && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Seu cupom:</p>
                    <p className="text-lg font-bold text-brand-blue">{wonPrize.couponCode}</p>
                  </div>
                )}

                <p className="text-gray-600 text-sm">{campaign.config.thankYouMessage}</p>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={resetWheel} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Jogar Novamente
                  </Button>
                  <Button variant="outline" onClick={shareResult} className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>
              </div>
            )}

            {/* Formulário pós-giro */}
            {hasSpun && !campaign.config.collectDataBefore && !isDataSaved && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <p className="text-center text-sm text-gray-600 mb-4">
                  Deixe seus dados para receber seu prêmio:
                </p>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={participantData.name}
                    onChange={(e) => setParticipantData({...participantData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={participantData.email}
                    onChange={(e) => setParticipantData({...participantData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={participantData.phone}
                    onChange={(e) => setParticipantData({...participantData, phone: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-brand-blue hover:bg-blue-600">
                  Finalizar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Campaign;
