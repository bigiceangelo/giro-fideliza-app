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
  description?: string;
  rules?: string;
  prize_description?: string;
  thank_you_message?: string;
  wheel_color?: string;
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
  const [showCampaignInfo, setShowCampaignInfo] = useState(true);
  const [participantData, setParticipantData] = useState<{[key: string]: string}>({});
  const [hasSpun, setHasSpun] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [participationId, setParticipationId] = useState<string | null>(null);
  const [dataCollected, setDataCollected] = useState(false);
  const [formData, setFormData] = useState<{[key: string]: string}>({});
  const [showForm, setShowForm] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const { toast } = useToast();

  // Derived variables from campaign data
  const customFields = campaign?.config.customFields || [];
  const prizes = campaign?.config.prizes || [];
  const winner = wonPrize ? { prize: wonPrize.name, couponCode: wonPrize.couponCode } : null;

  useEffect(() => {
    console.log('=== CAMPAIGN LOAD START ===');
    console.log('Campaign ID:', id);
    console.log('Current user:', supabase.auth.getUser());
    
    const loadCampaign = async () => {
      if (!id) {
        console.log('No ID provided');
        setLoading(false);
        return;
      }

      try {
        // Log do estado de autenticação
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current authenticated user:', user ? user.id : 'anonymous');

        // Buscar a campanha no Supabase
        console.log('Fetching campaign with ID:', id);
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

        console.log('Campaign found:', campaignData);

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
          description: campaignData.description || '',
          rules: campaignData.rules || '',
          prize_description: campaignData.prize_description || '',
          thank_you_message: campaignData.thank_you_message || 'Obrigado por participar!',
          wheel_color: campaignData.wheel_color || '#3B82F6',
          config: {
            prizes,
            collectDataBefore: campaignData.collect_data_before || false,
            thankYouMessage: campaignData.thank_you_message || 'Obrigado por participar!',
            wheelColor: campaignData.wheel_color || '#3B82F6',
            customFields
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

        // Check if we need to show form first
        if (campaignData.collect_data_before && customFields.length > 0) {
          setShowForm(true);
          setCanSpin(false);
        } else {
          setShowForm(false);
          setCanSpin(true);
        }

        setLoading(false);
        console.log('=== CAMPAIGN LOAD SUCCESS ===');

      } catch (error) {
        console.error('Unexpected error loading campaign:', error);
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

  const handlePrizeWon = async (prize: Prize) => {
    console.log('=== PRIZE WON ===');
    console.log('Prize:', prize);
    console.log('Prize name:', prize.name);
    console.log('Prize coupon:', prize.couponCode);
    
    setWonPrize(prize);
    setHasSpun(true);
    setIsSpinning(false);
    
    if (campaign?.config.collectDataBefore && participationId) {
      console.log('Updating existing participation with prize data');
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
          console.log('Successfully updated participation with prize:', {
            prize_won: prize.name,
            coupon_code: prize.couponCode
          });
        }
      } catch (error) {
        console.error('Error updating participation:', error);
      }
    } else {
      console.log('Creating new participation with prize data');
      await createParticipation(prize);
    }

    toast({
      title: 'Parabéns! 🎉',
      description: `Você ganhou: ${prize.name}`,
    });
  };

  const handleSpin = (prize: Prize) => {
    handlePrizeWon(prize);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION START ===');
    console.log('Campaign:', campaign?.id);
    console.log('Form data:', formData);
    
    if (!campaign) {
      console.error('No campaign available');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    console.log('User at submission time:', user ? user.id : 'anonymous');

    const missingFields = customFields.filter(field => 
      field.required && !formData[field.name]?.trim()
    );

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields.map(f => f.name));
      toast({
        title: 'Campos obrigatórios não preenchidos',
        description: `Por favor, preencha: ${missingFields.map(f => f.name).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    const phoneField = customFields.find(field => field.type === 'phone');
    if (phoneField && formData[phoneField.name]) {
      const phoneValue = formData[phoneField.name];
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      
      if (!phoneRegex.test(phoneValue)) {
        console.log('Invalid phone format:', phoneValue);
        toast({
          title: 'Telefone inválido',
          description: 'Use o formato (11) 99999-9999',
          variant: 'destructive',
        });
        return;
      }
    }

    const emailField = customFields.find(field => field.type === 'email');
    if (emailField && formData[emailField.name]) {
      const emailValue = formData[emailField.name];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(emailValue)) {
        console.log('Invalid email format:', emailValue);
        toast({
          title: 'Email inválido',
          description: 'Por favor, insira um email válido',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const participantDataForDb: any = {};
      
      customFields.forEach(field => {
        const value = formData[field.name];
        if (value) {
          const key = field.name.toLowerCase().replace(/\s+/g, '_');
          participantDataForDb[key] = value;
          participantDataForDb[field.name] = value;
        }
      });

      console.log('Data to be saved:', participantDataForDb);
      console.log('Campaign ID for insertion:', campaign.id);

      const { data: campaignCheck, error: checkError } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('id', campaign.id)
        .eq('status', 'active')
        .single();

      if (checkError) {
        console.error('Error checking campaign status:', checkError);
        throw new Error('Erro ao verificar status da campanha');
      }

      if (!campaignCheck) {
        console.error('Campaign not active or not found');
        throw new Error('Campanha não está ativa');
      }

      console.log('Campaign status verified as active:', campaignCheck);

      console.log('Attempting to insert participation...');
      const { data: participation, error } = await supabase
        .from('participations')
        .insert({
          campaign_id: campaign.id,
          participant_data: participantDataForDb,
          has_spun: false
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insertion error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Participation saved successfully:', participation);
      
      setParticipationId(participation.id);
      setShowForm(false);
      setCanSpin(true);

      const updatedParticipantData: {[key: string]: string} = {};
      customFields.forEach(field => {
        updatedParticipantData[field.id] = formData[field.name] || '';
      });
      setParticipantData(updatedParticipantData);

      toast({
        title: 'Dados salvos com sucesso!',
        description: 'Agora você pode girar a roda',
      });

      console.log('=== FORM SUBMISSION SUCCESS ===');
    } catch (error: any) {
      console.error('=== FORM SUBMISSION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      toast({
        title: 'Erro ao salvar dados',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    }
  };

  const formatPhoneInput = (value: string, fieldName: string) => {
    const digits = value.replace(/\D/g, '');
    
    let formatted = digits;
    if (digits.length >= 2) {
      formatted = `(${digits.slice(0, 2)})`;
      if (digits.length > 2) {
        formatted += ` ${digits.slice(2, 7)}`;
        if (digits.length > 7) {
          formatted += `-${digits.slice(7, 11)}`;
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: formatted
    }));
  };

  const handleInputChange = (fieldName: string, value: string, fieldType: string) => {
    if (fieldType === 'phone') {
      formatPhoneInput(value, fieldName);
    } else {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-blue"></div>
          <p className="mt-4 text-gray-600">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campanha não encontrada</h1>
          <p className="text-gray-600 mb-6">
            A campanha que você está procurando não existe ou não está mais disponível.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="mb-8 shadow-lg">
            <CardContent className="p-8 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-gray-600 mb-6">{campaign.description}</p>
              )}
              {campaign.rules && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-2">Regras:</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{campaign.rules}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form */}
          {showForm && (
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle>Preencha seus dados para participar</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <Label htmlFor={field.name}>
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id={field.name}
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                        required={field.required}
                        maxLength={field.type === 'phone' ? 15 : undefined}
                      />
                    </div>
                  ))}
                  <Button type="submit" className="w-full bg-brand-blue hover:bg-blue-600">
                    Participar da Promoção
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Wheel */}
          {!showForm && (
            <div className="text-center">
              <div className="mb-8">
                <SpinWheel
                  prizes={prizes}
                  onSpin={handleSpin}
                  isSpinning={isSpinning}
                  wheelColor={campaign.wheel_color || '#3B82F6'}
                />
              </div>
              
              {winner && (
                <Card className="shadow-lg">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-green-600 mb-4">
                      🎉 Parabéns!
                    </h2>
                    <p className="text-lg mb-4">
                      Você ganhou: <strong>{winner.prize}</strong>
                    </p>
                    {winner.couponCode && (
                      <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-600 mb-2">Seu código de cupom:</p>
                        <p className="text-xl font-mono font-bold text-yellow-700">
                          {winner.couponCode}
                        </p>
                      </div>
                    )}
                    {campaign.prize_description && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700">{campaign.prize_description}</p>
                      </div>
                    )}
                    {campaign.thank_you_message && (
                      <p className="text-gray-600">{campaign.thank_you_message}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Campaign;
