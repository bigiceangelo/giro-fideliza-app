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

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date';
  required: boolean;
  placeholder: string;
}

interface CampaignData {
  id: string;
  name: string;
  config: {
    prizes: Prize[];
    collectDataBefore: boolean;
    thankYouMessage: string;
    wheelColor: string;
    customFields?: CustomField[];
  };
}

const Campaign = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantData, setParticipantData] = useState<{[key: string]: string}>({});
  const [hasSpun, setHasSpun] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Loading campaign with ID:', id);
    
    const loadCampaign = () => {
      try {
        // Try to load from localStorage first
        const campaigns = localStorage.getItem('fidelizagiro_campaigns');
        console.log('Raw campaigns from localStorage:', campaigns);
        
        if (campaigns) {
          const parsedCampaigns = JSON.parse(campaigns);
          console.log('Parsed campaigns:', parsedCampaigns);
          
          const foundCampaign = parsedCampaigns.find((c: CampaignData) => c.id === id);
          console.log('Found campaign:', foundCampaign);
          
          if (foundCampaign) {
            // Ensure all required config properties exist
            const defaultConfig = {
              prizes: [],
              collectDataBefore: false,
              thankYouMessage: 'Obrigado por participar!',
              wheelColor: '#3B82F6',
              customFields: []
            };
            
            const campaign = {
              ...foundCampaign,
              config: {
                ...defaultConfig,
                ...foundCampaign.config,
                customFields: foundCampaign.config?.customFields || []
              }
            };
            
            console.log('Final campaign object:', campaign);
            setCampaign(campaign);
            setShowForm(campaign.config.collectDataBefore);
            
            // Initialize participant data
            const initialData: {[key: string]: string} = {};
            campaign.config.customFields.forEach(field => {
              initialData[field.id] = '';
            });
            setParticipantData(initialData);
            setLoading(false);
            return;
          }
        }
        
        // If not found in localStorage, campaign doesn't exist
        console.log('Campaign not found in localStorage');
        setCampaign(null);
        setLoading(false);
        
      } catch (error) {
        console.error('Error loading campaign:', error);
        setCampaign(null);
        setLoading(false);
      }
    };

    if (id) {
      loadCampaign();
    } else {
      setLoading(false);
    }
  }, [id]);

  const saveParticipantData = () => {
    if (!isDataSaved && campaign && campaign.config.customFields) {
      // Converter dados do participante para formato legível
      const readableData: {[key: string]: string} = {};
      campaign.config.customFields.forEach(field => {
        readableData[field.name.toLowerCase()] = participantData[field.id] || '';
      });

      const participation = {
        campaignId: id,
        ...readableData,
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
    
    // Converter dados do participante para formato legível
    const readableData: {[key: string]: string} = {};
    if (campaign && campaign.config.customFields) {
      campaign.config.customFields.forEach(field => {
        readableData[field.name.toLowerCase()] = participantData[field.id] || '';
      });
    }
    
    // Encontrar a participação atual e atualizá-la
    const currentParticipationIndex = participations.findIndex(
      (p: any) => p.campaignId === id && p.email === readableData.email && !p.hasSpun
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
        ...readableData,
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

  const validateForm = () => {
    if (!campaign || !campaign.config.customFields) return true;
    
    for (const field of campaign.config.customFields) {
      if (field.required && !participantData[field.id]?.trim()) {
        return false;
      }
    }
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se todos os campos obrigatórios estão preenchidos
    if (!validateForm()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
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
    
    // Resetar dados do participante
    if (campaign && campaign.config.customFields) {
      const initialData: {[key: string]: string} = {};
      campaign.config.customFields.forEach(field => {
        initialData[field.id] = '';
      });
      setParticipantData(initialData);
    }
    
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-lime-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-lime rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-lime-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campanha não encontrada</h1>
          <p className="text-gray-600 mb-4">A campanha que você está procurando não existe ou foi removida.</p>
          <p className="text-sm text-gray-500">ID da campanha: {id}</p>
          <div className="mt-6">
            <Button onClick={() => window.location.href = '/'} className="bg-brand-blue hover:bg-blue-600">
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se não tem campos customizados, não mostrar formulário
  const hasCustomFields = campaign.config.customFields && campaign.config.customFields.length > 0;

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
            {showForm && !hasSpun && hasCustomFields && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {campaign.config.customFields?.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={participantData[field.id] || ''}
                      onChange={(e) => setParticipantData({
                        ...participantData,
                        [field.id]: e.target.value
                      })}
                      required={field.required}
                    />
                  </div>
                ))}
                <Button type="submit" className="w-full bg-brand-blue hover:bg-blue-600">
                  {campaign.config.collectDataBefore ? 'Continuar' : 'Girar a Roda!'}
                </Button>
              </form>
            )}

            {/* Roda da Fortuna */}
            {(!showForm || !hasCustomFields) && !hasSpun && (
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
            {hasSpun && !campaign.config.collectDataBefore && !isDataSaved && hasCustomFields && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <p className="text-center text-sm text-gray-600 mb-4">
                  Deixe seus dados para receber seu prêmio:
                </p>
                {campaign.config.customFields?.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={participantData[field.id] || ''}
                      onChange={(e) => setParticipantData({
                        ...participantData,
                        [field.id]: e.target.value
                      })}
                      required={field.required}
                    />
                  </div>
                ))}
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
