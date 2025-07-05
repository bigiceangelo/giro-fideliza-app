
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Share2, RotateCcw, Play, Info, Gift } from 'lucide-react';
import SpinWheel from '@/components/SpinWheel';
import { supabase } from '@/integrations/supabase/client';

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
    description?: string;
    rules?: string;
    prizeDescription?: string;
  };
}

const Campaign = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCampaignInfo, setShowCampaignInfo] = useState(true);
  const [participantData, setParticipantData] = useState<{[key: string]: string}>({});
  const [hasSpun, setHasSpun] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [participationId, setParticipationId] = useState<string | null>(null);
  const [dataCollected, setDataCollected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('=== CAMPAIGN LOAD START ===');
    console.log('Campaign ID:', id);
    
    const loadCampaign = async () => {
      if (!id) {
        console.log('No ID provided');
        setLoading(false);
        return;
      }

      try {
        // Buscar a campanha no Supabase
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .eq('status', 'active')
          .single();

        if (campaignError) {
          console.error('Error loading campaign:', campaignError);
          setCampaign(null);
          setLoading(false);
          return;
        }

        if (!campaignData) {
          console.log('Campaign not found or not active');
          setCampaign(null);
          setLoading(false);
          return;
        }

        // Buscar os prêmios da campanha
        const { data: prizesData, error: prizesError } = await supabase
          .from('campaign_prizes')
          .select('*')
          .eq('campaign_id', id);

        if (prizesError) {
          console.error('Error loading prizes:', prizesError);
        }

        // Buscar os campos customizados da campanha
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('campaign_custom_fields')
          .select('*')
          .eq('campaign_id', id);

        if (fieldsError) {
          console.error('Error loading custom fields:', fieldsError);
        }

        // Converter os dados para o formato esperado
        const prizes: Prize[] = (prizesData || []).map(prize => ({
          id: prize.id,
          name: prize.name,
          percentage: prize.percentage,
          couponCode: prize.coupon_code || ''
        }));

        const customFields: CustomField[] = (fieldsData || []).map(field => ({
          id: field.id,
          name: field.name,
          type: field.type as 'text' | 'email' | 'phone' | 'number' | 'date',
          required: field.required || false,
          placeholder: field.placeholder || ''
        }));

        const campaign: CampaignData = {
          id: campaignData.id,
          name: campaignData.name,
          config: {
            prizes,
            collectDataBefore: campaignData.collect_data_before || false,
            thankYouMessage: campaignData.thank_you_message || 'Obrigado por participar!',
            wheelColor: campaignData.wheel_color || '#3B82F6',
            customFields,
            description: campaignData.description || '',
            rules: campaignData.rules || '',
            prizeDescription: campaignData.prize_description || ''
          }
        };

        console.log('Campaign loaded successfully:', campaign);
        setCampaign(campaign);

        // Initialize participant data
        const initialData: {[key: string]: string} = {};
        customFields.forEach(field => {
          initialData[field.id] = '';
        });
        setParticipantData(initialData);
        setLoading(false);
        console.log('=== CAMPAIGN LOAD SUCCESS ===');

      } catch (error) {
        console.error('Error loading campaign:', error);
        setCampaign(null);
        setLoading(false);
        console.log('=== CAMPAIGN LOAD ERROR ===');
      }
    };

    loadCampaign();
  }, [id]);

  const createParticipation = async (prize?: Prize) => {
    if (!campaign || !id) return null;

    const participantDataPayload: any = {};
    
    if (campaign.config.customFields && campaign.config.customFields.length > 0) {
      campaign.config.customFields.forEach(field => {
        const value = participantData[field.id] || '';
        if (value) {
          participantDataPayload[field.name.toLowerCase()] = value;
        }
      });
    }

    const participation = {
      campaign_id: id,
      participant_data: participantDataPayload,
      has_spun: !!prize,
      ...(prize && {
        prize_won: prize.name,
        coupon_code: prize.couponCode
      })
    };

    try {
      const { data, error } = await supabase
        .from('participations')
        .insert([participation])
        .select()
        .single();

      if (error) {
        console.error('Error creating participation:', error);
        return null;
      }

      setParticipationId(data.id);
      console.log('Participation created:', data);
      return data.id;
    } catch (error) {
      console.error('Error creating participation:', error);
      return null;
    }
  };

  const updateParticipationWithData = async (participationId: string) => {
    if (!campaign?.config.customFields) return;

    const participantDataPayload: any = {};
    campaign.config.customFields.forEach(field => {
      participantDataPayload[field.name.toLowerCase()] = participantData[field.id] || '';
    });

    try {
      const { error } = await supabase
        .from('participations')
        .update({
          participant_data: participantDataPayload
        })
        .eq('id', participationId);

      if (error) {
        console.error('Error updating participation:', error);
      } else {
        console.log('Participation updated with data');
      }
    } catch (error) {
      console.error('Error updating participation:', error);
    }
  };

  const handlePrizeWon = async (prize: Prize) => {
    console.log('=== PRIZE WON ===');
    console.log('Prize:', prize.name);
    
    setWonPrize(prize);
    setHasSpun(true);
    setIsSpinning(false);
    
    if (campaign?.config.collectDataBefore && participationId) {
      try {
        const { error } = await supabase
          .from('participations')
          .update({
            prize_won: prize.name,
            coupon_code: prize.couponCode,
            has_spun: true
          })
          .eq('id', participationId);

        if (error) {
          console.error('Error updating participation with prize:', error);
        } else {
          console.log('Updated existing participation with prize');
        }
      } catch (error) {
        console.error('Error updating participation:', error);
      }
    } else {
      await createParticipation(prize);
    }

    toast({
      title: 'Parabéns! 🎉',
      description: `Você ganhou: ${prize.name}`,
    });
  };

  const validateForm = () => {
    if (!campaign?.config.customFields) return true;
    
    for (const field of campaign.config.customFields) {
      if (field.required && !participantData[field.id]?.trim()) {
        return false;
      }
    }
    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
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
      const newParticipationId = await createParticipation();
      if (newParticipationId) {
        setDataCollected(true);
        toast({
          title: 'Dados salvos!',
          description: 'Agora você pode girar a roda da fortuna!',
        });
      }
    } else if (hasSpun && participationId) {
      await updateParticipationWithData(participationId);
      setDataCollected(true);
      toast({
        title: 'Dados salvos!',
        description: 'Obrigado por participar!',
      });
    }
  };

  const resetWheel = () => {
    setHasSpun(false);
    setWonPrize(null);
    setParticipationId(null);
    setDataCollected(false);
    setShowCampaignInfo(true);
    
    if (campaign?.config.customFields) {
      const initialData: {[key: string]: string} = {};
      campaign.config.customFields.forEach(field => {
        initialData[field.id] = '';
      });
      setParticipantData(initialData);
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

  const startParticipation = () => {
    setShowCampaignInfo(false);
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

  // Show campaign information first
  if (showCampaignInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-lime-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
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
              <CardTitle className="text-2xl">{campaign.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Descrição da Campanha */}
              {campaign.config.description && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Info className="w-5 h-5 text-brand-blue" />
                    <h3 className="text-lg font-semibold">Sobre a Campanha</h3>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{campaign.config.description}</p>
                  </div>
                </div>
              )}

              {/* Prêmios Disponíveis */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-brand-gold" />
                  <h3 className="text-lg font-semibold">Prêmios Disponíveis</h3>
                </div>
                <div className="bg-gradient-to-br from-brand-gold to-yellow-100 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {campaign.config.prizes.map((prize, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800">{prize.name}</span>
                          <span className="text-sm bg-brand-blue text-white px-2 py-1 rounded">
                            {prize.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {campaign.config.prizeDescription && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.config.prizeDescription}</p>
                  </div>
                )}
              </div>

              {/* Regras */}
              {campaign.config.rules && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Regras da Campanha</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{campaign.config.rules}</p>
                  </div>
                </div>
              )}

              {/* Botão para iniciar */}
              <div className="text-center pt-4">
                <Button 
                  onClick={startParticipation} 
                  className="w-full bg-gradient-to-r from-brand-blue to-brand-lime hover:from-blue-600 hover:to-green-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Participar da Promoção
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Participation flow (existing logic)
  const hasCustomFields = campaign.config.customFields && campaign.config.customFields.length > 0;
  const shouldShowPreSpinForm = hasCustomFields && campaign.config.collectDataBefore && !dataCollected && !hasSpun;
  const shouldShowWheel = (!hasCustomFields || !campaign.config.collectDataBefore || dataCollected) && !hasSpun;
  const shouldShowPostSpinForm = hasCustomFields && !campaign.config.collectDataBefore && hasSpun && !dataCollected;
  const shouldShowResult = hasSpun && wonPrize && (campaign.config.collectDataBefore || dataCollected || !hasCustomFields);

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
            {/* PRE-SPIN FORM */}
            {shouldShowPreSpinForm && (
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

            {/* SPIN WHEEL */}
            {shouldShowWheel && (
              <div className="text-center">
                <SpinWheel
                  prizes={campaign.config.prizes}
                  onSpin={handlePrizeWon}
                  isSpinning={isSpinning}
                  wheelColor={campaign.config.wheelColor}
                />
              </div>
            )}

            {/* POST-SPIN FORM */}
            {shouldShowPostSpinForm && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-brand-gold to-yellow-500 p-4 rounded-xl text-white text-center mb-4">
                  <div className="text-3xl mb-2">🎉</div>
                  <h3 className="text-lg font-bold mb-1">Parabéns!</h3>
                  <p className="text-sm">Você ganhou: <strong>{wonPrize?.name}</strong></p>
                  {wonPrize?.couponCode && (
                    <p className="text-sm mt-2">Cupom: <strong>{wonPrize.couponCode}</strong></p>
                  )}
                </div>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <p className="text-center text-sm text-gray-600 mb-4">
                    <strong>Para confirmar seu prêmio, preencha seus dados:</strong>
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
                    Finalizar e Confirmar Prêmio
                  </Button>
                </form>
              </div>
            )}

            {/* RESULT DISPLAY */}
            {shouldShowResult && (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Campaign;
