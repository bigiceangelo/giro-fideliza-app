
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import CampaignStep1 from '@/components/campaign/CampaignStep1';
import CampaignStep2 from '@/components/campaign/CampaignStep2';
import CampaignStep3 from '@/components/campaign/CampaignStep3';

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

const CreateCampaign = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 - Configuração Básica
  const [campaignName, setCampaignName] = useState('');
  const [maxUsesPerEmail, setMaxUsesPerEmail] = useState(1);
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: '1', name: 'Desconto 10%', percentage: 30, couponCode: 'DESC10' },
    { id: '2', name: 'Desconto 20%', percentage: 20, couponCode: 'DESC20' },
    { id: '3', name: 'Brinde Grátis', percentage: 15, couponCode: 'BRINDE' },
    { id: '4', name: 'Tente Novamente', percentage: 35, couponCode: '' }
  ]);
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: '1', name: 'Nome', type: 'text', required: true, placeholder: 'Seu nome completo' },
    { id: '2', name: 'Email', type: 'email', required: true, placeholder: 'seu@email.com' },
    { id: '3', name: 'WhatsApp', type: 'phone', required: true, placeholder: '(11) 99999-9999' }
  ]);
  const [collectDataBefore, setCollectDataBefore] = useState(true);

  // Step 2 - Descrições e Configurações
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [showPrizes, setShowPrizes] = useState(false);
  const [wheelColor, setWheelColor] = useState('#007BFF');
  const [thankYouMessage, setThankYouMessage] = useState('Obrigado por participar da nossa promoção!');

  // Step 3 - WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('Olá! Ganhei um prêmio na sua promoção e gostaria de resgatar.');

  const handleSubmit = async () => {
    setIsLoading(true);

    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para criar uma campanha',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      // Formatar número do WhatsApp
      const formatPhoneNumber = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (!cleaned.startsWith('55') && cleaned.length >= 10) {
          return `55${cleaned}`;
        }
        return cleaned;
      };

      // Criar campanha no Supabase
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: campaignName,
          user_id: user.id,
          status: 'active',
          collect_data_before: collectDataBefore,
          thank_you_message: thankYouMessage,
          wheel_color: wheelColor,
          description,
          rules: rules || null,
          prize_description: prizeDescription || null,
          show_prizes: showPrizes,
          max_uses_per_email: maxUsesPerEmail,
          whatsapp_number: formatPhoneNumber(whatsappNumber),
          whatsapp_message: whatsappMessage,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Inserir prêmios
      const prizesData = prizes.map(prize => ({
        campaign_id: campaign.id,
        name: prize.name,
        percentage: prize.percentage,
        coupon_code: prize.couponCode || null,
      }));

      const { error: prizesError } = await supabase
        .from('campaign_prizes')
        .insert(prizesData);

      if (prizesError) throw prizesError;

      // Inserir campos personalizados
      const customFieldsData = customFields.map(field => ({
        campaign_id: campaign.id,
        name: field.name,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder || null,
      }));

      const { error: fieldsError } = await supabase
        .from('campaign_custom_fields')
        .insert(customFieldsData);

      if (fieldsError) throw fieldsError;

      toast({
        title: 'Campanha criada com sucesso!',
        description: 'Sua campanha está pronta para receber participantes',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      toast({
        title: 'Erro ao criar campanha',
        description: error.message || 'Tente novamente em alguns instantes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CampaignStep1
            campaignName={campaignName}
            setCampaignName={setCampaignName}
            prizes={prizes}
            setPrizes={setPrizes}
            customFields={customFields}
            setCustomFields={setCustomFields}
            collectDataBefore={collectDataBefore}
            setCollectDataBefore={setCollectDataBefore}
            maxUsesPerEmail={maxUsesPerEmail}
            setMaxUsesPerEmail={setMaxUsesPerEmail}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        return (
          <CampaignStep2
            description={description}
            setDescription={setDescription}
            rules={rules}
            setRules={setRules}
            prizeDescription={prizeDescription}
            setPrizeDescription={setPrizeDescription}
            showPrizes={showPrizes}
            setShowPrizes={setShowPrizes}
            wheelColor={wheelColor}
            setWheelColor={setWheelColor}
            thankYouMessage={thankYouMessage}
            setThankYouMessage={setThankYouMessage}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <CampaignStep3
            whatsappNumber={whatsappNumber}
            setWhatsappNumber={setWhatsappNumber}
            whatsappMessage={whatsappMessage}
            setWhatsappMessage={setWhatsappMessage}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onBack={() => setCurrentStep(2)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-between">
                Criar Nova Campanha
                <div className="text-sm font-normal text-gray-500">
                  Passo {currentStep} de 3
                </div>
              </CardTitle>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-brand-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {renderStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
