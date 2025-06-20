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
  const [participationId, setParticipationId] = useState<string | null>(null);
  const [dataCollected, setDataCollected] = useState(false); // Nova flag para controlar se os dados foram coletados
  const { toast } = useToast();

  useEffect(() => {
    console.log('=== CAMPAIGN DEBUG START ===');
    console.log('Campaign ID from URL:', id);
    
    const loadCampaign = () => {
      try {
        const campaigns = localStorage.getItem('fidelizagiro_campaigns');
        console.log('Raw campaigns from localStorage:', campaigns);
        
        if (!campaigns) {
          console.log('Nenhuma campanha encontrada no localStorage');
          setCampaign(null);
          setLoading(false);
          return;
        }
        
        const parsedCampaigns = JSON.parse(campaigns);
        console.log('Parsed campaigns:', parsedCampaigns);
        
        const foundCampaign = parsedCampaigns.find((c: CampaignData) => {
          console.log(`Comparando: "${c.id}" === "${id}"`);
          return c.id === id;
        });
        
        console.log('Campanha encontrada:', foundCampaign);
        
        if (foundCampaign) {
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
          console.log('Collect data before spin:', campaign.config.collectDataBefore);
          
          setCampaign(campaign);
          
          // Definir se deve mostrar formulário baseado na configuração
          if (campaign.config.collectDataBefore) {
            setShowForm(true); // Mostrar formulário antes do giro
          } else {
            setShowForm(false); // Não mostrar formulário antes, apenas a roda
          }
          
          // Initialize participant data
          const initialData: {[key: string]: string} = {};
          campaign.config.customFields.forEach(field => {
            initialData[field.id] = '';
          });
          setParticipantData(initialData);
          setLoading(false);
          console.log('=== CAMPAIGN DEBUG END (SUCCESS) ===');
          return;
        }
        
        console.log('Campanha não encontrada com ID:', id);
        setCampaign(null);
        setLoading(false);
        console.log('=== CAMPAIGN DEBUG END (NOT FOUND) ===');
        
      } catch (error) {
        console.error('Erro ao carregar campanha:', error);
        setCampaign(null);
        setLoading(false);
        console.log('=== CAMPAIGN DEBUG END (ERROR) ===');
      }
    };

    if (id) {
      loadCampaign();
    } else {
      console.log('ID não fornecido na URL');
      setLoading(false);
    }
  }, [id]);

  const createParticipation = () => {
    if (!campaign || !campaign.config.customFields || participationId) return null;

    const newParticipationId = `${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const readableData: {[key: string]: string} = {};
    campaign.config.customFields.forEach(field => {
      readableData[field.name.toLowerCase()] = participantData[field.id] || '';
    });

    const participation = {
      id: newParticipationId,
      campaignId: id,
      ...readableData,
      timestamp: new Date().toISOString(),
      hasSpun: false
    };
    
    const existingParticipations = localStorage.getItem('fidelizagiro_participations');
    const participations = existingParticipations ? JSON.parse(existingParticipations) : [];
    participations.push(participation);
    localStorage.setItem('fidelizagiro_participations', JSON.stringify(participations));
    
    setParticipationId(newParticipationId);
    console.log('Participação criada:', participation);
    
    return newParticipationId;
  };

  const updateParticipationWithPrize = (participationId: string, prize: Prize) => {
    const existingParticipations = localStorage.getItem('fidelizagiro_participations');
    const participations = existingParticipations ? JSON.parse(existingParticipations) : [];
    
    const participationIndex = participations.findIndex((p: any) => p.id === participationId);
    
    if (participationIndex >= 0) {
      participations[participationIndex] = {
        ...participations[participationIndex],
        prize: prize.name,
        couponCode: prize.couponCode,
        hasSpun: true,
        spinTimestamp: new Date().toISOString()
      };
      
      localStorage.setItem('fidelizagiro_participations', JSON.stringify(participations));
      console.log('Participação atualizada com prêmio:', participations[participationIndex]);
    }
  };

  const handlePrizeWon = (prize: Prize) => {
    setWonPrize(prize);
    setHasSpun(true);
    setIsSpinning(false);
    
    console.log('Prêmio ganho:', prize.name);
    console.log('Coleta dados antes?', campaign?.config.collectDataBefore);
    console.log('Tem campos customizados?', campaign?.config.customFields?.length || 0);
    
    if (participationId) {
      // Se já temos uma participação (dados coletados antes), apenas atualizamos com o prêmio
      updateParticipationWithPrize(participationId, prize);
    } else {
      // Se não coletou dados antes, criamos participação básica com o prêmio
      const newParticipationId = `${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const participation = {
        id: newParticipationId,
        campaignId: id,
        prize: prize.name,
        couponCode: prize.couponCode,
        hasSpun: true,
        timestamp: new Date().toISOString(),
        spinTimestamp: new Date().toISOString()
      };
      
      const existingParticipations = localStorage.getItem('fidelizagiro_participations');
      const participations = existingParticipations ? JSON.parse(existingParticipations) : [];
      participations.push(participation);
      localStorage.setItem('fidelizagiro_participations', JSON.stringify(participations));
      
      setParticipationId(newParticipationId);
      console.log('Participação criada após giro:', participation);
    }

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
    
    if (!validateForm()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (campaign?.config.collectDataBefore && !hasSpun) {
      // ANTES DO GIRO: Coletar dados e depois permitir girar
      createParticipation();
      setShowForm(false);
      setDataCollected(true);
      toast({
        title: 'Dados salvos!',
        description: 'Agora você pode girar a roda da fortuna!',
      });
    } else if (hasSpun && !campaign?.config.collectDataBefore && participationId) {
      // APÓS O GIRO: Atualizar participação existente com os dados
      const existingParticipations = localStorage.getItem('fidelizagiro_participations');
      const participations = existingParticipations ? JSON.parse(existingParticipations) : [];
      
      const participationIndex = participations.findIndex((p: any) => p.id === participationId);
      
      if (participationIndex >= 0 && campaign.config.customFields) {
        const readableData: {[key: string]: string} = {};
        campaign.config.customFields.forEach(field => {
          readableData[field.name.toLowerCase()] = participantData[field.id] || '';
        });
        
        participations[participationIndex] = {
          ...participations[participationIndex],
          ...readableData
        };
        
        localStorage.setItem('fidelizagiro_participations', JSON.stringify(participations));
        console.log('Dados adicionados à participação existente:', participations[participationIndex]);
      }
      
      setDataCollected(true);
      toast({
        title: 'Dados salvos!',
        description: 'Obrigado por participar!',
      });
    } else {
      // Caso padrão - apenas girar (não deveria chegar aqui normalmente)
      startSpin();
    }
  };

  const resetWheel = () => {
    setHasSpun(false);
    setWonPrize(null);
    setParticipationId(null);
    setDataCollected(false);
    
    if (campaign && campaign.config.customFields) {
      const initialData: {[key: string]: string} = {};
      campaign.config.customFields.forEach(field => {
        initialData[field.id] = '';
      });
      setParticipantData(initialData);
    }
    
    // Resetar formulário baseado na configuração
    if (campaign?.config.collectDataBefore) {
      setShowForm(true); // Mostrar formulário antes do giro
    } else {
      setShowForm(false); // Não mostrar formulário antes, apenas a roda
    }
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

  // Se não tem campos customizados, não precisa de formulários
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
            {/* DEBUG INFO - REMOVER EM PRODUÇÃO */}
            <div className="bg-gray-100 p-2 rounded text-xs text-gray-600">
              <p><strong>Debug:</strong></p>
              <p>collectDataBefore: {campaign.config.collectDataBefore ? 'true' : 'false'}</p>
              <p>hasSpun: {hasSpun ? 'true' : 'false'}</p>
              <p>wonPrize: {wonPrize ? wonPrize.name : 'null'}</p>
              <p>dataCollected: {dataCollected ? 'true' : 'false'}</p>
              <p>hasCustomFields: {hasCustomFields ? 'true' : 'false'}</p>
              <p>showForm: {showForm ? 'true' : 'false'}</p>
            </div>
            {/* FORMULÁRIO ANTES DO GIRO (collectDataBefore = true) */}
            {showForm && !hasSpun && hasCustomFields && campaign.config.collectDataBefore && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <p className="text-center text-sm text-gray-600 mb-4">
                  Preencha seus dados para participar:
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
                  Continuar para a Roda
                </Button>
              </form>
            )}

            {/* RODA DA FORTUNA */}
            {(!showForm || !hasCustomFields || (dataCollected && campaign.config.collectDataBefore)) && !hasSpun && (
              <div className="text-center">
                <SpinWheel
                  prizes={campaign.config.prizes}
                  onSpin={handlePrizeWon}
                  isSpinning={isSpinning}
                  wheelColor={campaign.config.wheelColor}
                />
              </div>
            )}

            {/* RESULTADO DO PRÊMIO - Só mostra se já coletou dados OU não precisa coletar */}
            {hasSpun && wonPrize && (campaign.config.collectDataBefore || dataCollected || !hasCustomFields) && (
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

            {/* FORMULÁRIO APÓS O GIRO (collectDataBefore = false) - APARECE LOGO APÓS GANHAR */}
            {hasSpun && wonPrize && !campaign.config.collectDataBefore && !dataCollected && hasCustomFields && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-brand-gold to-yellow-500 p-4 rounded-xl text-white text-center mb-4">
                  <div className="text-3xl mb-2">🎉</div>
                  <h3 className="text-lg font-bold mb-1">Parabéns!</h3>
                  <p className="text-sm">Você ganhou: <strong>{wonPrize.name}</strong></p>
                  {wonPrize.couponCode && (
                    <p className="text-sm mt-2">Cupom: <strong>{wonPrize.couponCode}</strong></p>
                  )}
                </div>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <p className="text-center text-sm text-gray-600 mb-4">
                    <strong>Para receber seu prêmio, preencha seus dados:</strong>
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
                    Finalizar e Receber Prêmio
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Campaign;
