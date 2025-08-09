import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import SpinWheel from '@/components/SpinWheel';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Trophy, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

interface CampaignData {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  prize_description?: string;
  collect_data_before?: boolean;
  thank_you_message?: string;
  wheel_color?: string;
  campaign_prizes: {
    id: string;
    name: string;
    percentage: number;
    coupon_code?: string;
  }[];
  campaign_custom_fields: {
    id: string;
    name: string;
    type: string;
    required: boolean;
    placeholder?: string;
  }[];
  show_prizes?: boolean;
  max_uses_per_email?: number;
  whatsapp_number?: string;
  whatsapp_message?: string;
  prize_expiry_days?: number;
}

const Campaign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDataForm, setShowDataForm] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [formData, setFormData] = useState({});
  const [currentParticipation, setCurrentParticipation] = useState<any>(null);
  const [wonPrize, setWonPrize] = useState('');
  const [wonCoupon, setWonCoupon] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasAlreadySpun, setHasAlreadySpun] = useState(false);
  const [prizeExpiryDate, setPrizeExpiryDate] = useState<Date | null>(null);

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_prizes(*),
          campaign_custom_fields(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setCampaign(data);
      setIsLoading(false);
      setShowDataForm(data?.collect_data_before === true);
      setShowWheel(data?.collect_data_before !== true);
    } catch (error: any) {
      console.error('Error loading campaign:', error);
      toast({
        title: 'Erro ao carregar campanha',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const createParticipation = async (userData: any) => {
    if (!campaign) return null;

    const email = userData.email || userData.Email;
    console.log('=== VERIFICAÇÃO CRÍTICA DE EMAIL ===');
    console.log('Campaign ID:', campaign.id);
    console.log('Email verificado:', email);
    console.log('Limite por email:', campaign.max_uses_per_email);
    
    // VERIFICAÇÃO RIGOROSA: Bloquear emails duplicados
    if (campaign.max_uses_per_email && campaign.max_uses_per_email > 0) {
      try {
        // Buscar TODAS as participações com este email (case insensitive)
        const { data: existingParticipations, error: countError } = await supabase
          .from('participations')
          .select('*')
          .eq('campaign_id', campaign.id)
          .or(`participant_data->>email.ilike.${email},participant_data->>Email.ilike.${email}`);

        console.log('=== PARTICIPAÇÕES EXISTENTES ===');
        console.log('Erro na consulta:', countError);
        console.log('Participações encontradas:', existingParticipations);

        if (countError) {
          console.error('Erro ao verificar participações:', countError);
          toast({
            title: 'Erro ao verificar email',
            description: 'Tente novamente',
            variant: 'destructive',
          });
          return null;
        }

        // Se encontrou participações, BLOQUEAR
        if (existingParticipations && existingParticipations.length > 0) {
          console.log('=== EMAIL JÁ PARTICIPOU - BLOQUEADO ===');
          
          const lastParticipation = existingParticipations[existingParticipations.length - 1];
          console.log('Última participação:', lastParticipation);
          
          // Se já girou, mostrar resultado anterior
          if (lastParticipation.has_spun) {
            setCurrentParticipation(lastParticipation);
            setHasAlreadySpun(true);
            setWonPrize(lastParticipation.prize_won || 'Tente Novamente');
            setWonCoupon(lastParticipation.coupon_code || '');
            
            const expiryDays = campaign?.prize_expiry_days || 30;
            const participationDate = toZonedTime(new Date(lastParticipation.created_at), 'America/Sao_Paulo');
            const expiryDate = addDays(participationDate, expiryDays);
            setPrizeExpiryDate(expiryDate);
            
            setShowResult(true);
            setShowDataForm(false);
            setShowWheel(false);
          }
          
          toast({
            title: 'Email já utilizado',
            description: `Este email já foi usado ${existingParticipations.length} vez(es) nesta campanha.`,
            variant: 'destructive',
          });
          return null;
        }

      } catch (error) {
        console.error('Erro na verificação de email:', error);
        toast({
          title: 'Erro na verificação',
          description: 'Tente novamente',
          variant: 'destructive',
        });
        return null;
      }
    }

    // Criar nova participação com timestamp em São Paulo
    try {
      console.log('=== CRIANDO NOVA PARTICIPAÇÃO ===');
      const saoPauloTime = toZonedTime(new Date(), 'America/Sao_Paulo');
      
      const { data, error } = await supabase
        .from('participations')
        .insert({
          campaign_id: campaign.id,
          participant_data: userData,
          has_spun: false,
          created_at: saoPauloTime.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar participação:', error);
        throw error;
      }
      
      console.log('=== PARTICIPAÇÃO CRIADA COM SUCESSO ===');
      console.log('Nova participação:', data);
      return data;
      
    } catch (error) {
      console.error('Erro ao criar participação:', error);
      toast({
        title: 'Erro ao registrar',
        description: 'Não foi possível registrar sua participação',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handlePrizeWon = async (prize: any) => {
    if (!currentParticipation || hasAlreadySpun) {
      console.log('=== NÃO PODE PROCESSAR PRÊMIO ===');
      return;
    }

    console.log('=== PROCESSANDO PRÊMIO GANHO ===');
    console.log('Prêmio:', prize);
    console.log('ID da Participação:', currentParticipation.id);
    
    setIsSpinning(false);

    // Calcular data de expiração no horário de São Paulo
    const expiryDays = campaign?.prize_expiry_days || 30;
    const saoPauloNow = toZonedTime(new Date(), 'America/Sao_Paulo');
    const expiryDate = addDays(saoPauloNow, expiryDays);
    setPrizeExpiryDate(expiryDate);

    try {
      console.log('=== ATUALIZANDO PARTICIPAÇÃO COM PRÊMIO ===');
      
      const updateData = {
        has_spun: true,
        prize_won: prize.name,
        coupon_code: prize.couponCode || null,
        updated_at: saoPauloNow.toISOString()
      };
      
      console.log('Dados para atualização:', updateData);
      
      const { data: updatedData, error } = await supabase
        .from('participations')
        .update(updateData)
        .eq('id', currentParticipation.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar participação:', error);
        throw error;
      }

      console.log('=== PARTICIPAÇÃO ATUALIZADA COM SUCESSO ===');
      console.log('Dados atualizados:', updatedData);
      
      // Atualizar estado local
      const updatedParticipation = {
        ...currentParticipation,
        has_spun: true,
        prize_won: prize.name,
        coupon_code: prize.couponCode || null
      };
      
      setCurrentParticipation(updatedParticipation);
      setWonPrize(prize.name);
      setWonCoupon(prize.couponCode || '');
      setHasAlreadySpun(true);
      setShowResult(true);
      
      toast({
        title: 'Prêmio salvo!',
        description: `Você ganhou: ${prize.name}`,
      });
      
    } catch (error) {
      console.error('Erro ao salvar prêmio:', error);
      toast({
        title: 'Erro ao salvar prêmio',
        description: 'Houve um problema. Entre em contato conosco.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
    console.log('=== FORMULÁRIO ENVIADO ===');
    console.log('Dados do formulário:', data);
    
    setFormData(data);

    const participation = await createParticipation(data);

    if (participation) {
      console.log('=== PARTICIPAÇÃO BEM SUCEDIDA ===');
      setCurrentParticipation(participation);
      setShowDataForm(false);
      setShowWheel(true);
    }

    setIsLoading(false);
  };

  const renderDataForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Participe da Nossa Campanha!</h2>
          <p className="text-gray-600">Preencha seus dados para concorrer</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {campaign.campaign_custom_fields.map(field => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                    {field.name} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ))}
              <Button 
                disabled={isLoading} 
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? 'Enviando...' : 'Participar Agora'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const getWhatsAppLink = () => {
    if (!campaign?.whatsapp_number || !campaign?.whatsapp_message) {
      return null;
    }
    
    const encodedMessage = encodeURIComponent(campaign.whatsapp_message);
    return `https://wa.me/${campaign.whatsapp_number}?text=${encodedMessage}`;
  };

  const handleGoToCampaign = () => {
    // Reset para nova participação
    setShowResult(false);
    setShowWheel(false);
    setShowDataForm(true);
    setHasAlreadySpun(false);
    setCurrentParticipation(null);
    setWonPrize('');
    setWonCoupon('');
    setPrizeExpiryDate(null);
    setFormData({});
  };

  const renderResultPopup = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md text-center shadow-2xl animate-scale-in border-0 bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            🎉 Parabéns!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div>
            <p className="text-gray-600 mb-2">Você ganhou:</p>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{wonPrize}</p>
            </div>
          </div>
          
          {wonCoupon && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Código do cupom:</p>
              <div className="bg-white p-3 rounded border-2 border-dashed border-gray-300 shadow-inner">
                <p className="text-lg font-mono font-bold text-gray-800">{wonCoupon}</p>
              </div>
            </div>
          )}

          {prizeExpiryDate && wonPrize !== 'Tente Novamente' && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <Calendar className="w-4 h-4" />
                <p className="text-sm font-medium">
                  Válido até: {formatInTimeZone(prizeExpiryDate, 'America/Sao_Paulo', "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {campaign?.thank_you_message && (
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{campaign.thank_you_message}</p>
            )}
            
            <div className="space-y-3">
              {getWhatsAppLink() && wonPrize !== 'Tente Novamente' && (
                <Button
                  onClick={() => window.open(getWhatsAppLink(), '_blank')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  🎁 Resgatar Prêmio
                </Button>
              )}

              <Button
                onClick={handleGoToCampaign}
                variant="outline"
                className="w-full border-gray-200 hover:bg-gray-50"
              >
                Nova Participação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWheel = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Campaign Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {campaign.name}
          </h1>
          <p className="text-gray-600 text-sm">Gire a roda e ganhe prêmios incríveis!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lado esquerdo - Informações em acordeão (menor espaço) */}
          <div className="lg:col-span-1">
            {(campaign.description || campaign.rules || campaign.prize_description) && (
              <Accordion type="single" collapsible className="space-y-2">
                {campaign.description && (
                  <AccordionItem value="about" className="border rounded-lg bg-white/80 backdrop-blur-sm shadow-sm">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline text-xs">
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                        <Gift className="w-3 h-3" />
                        Sobre
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <p className="text-gray-600 text-xs leading-relaxed">{campaign.description}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {campaign.rules && (
                  <AccordionItem value="rules" className="border rounded-lg bg-white/80 backdrop-blur-sm shadow-sm">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline text-xs">
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                        <Trophy className="w-3 h-3" />
                        Regras
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <div className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{campaign.rules}</div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {campaign.prize_description && (
                  <AccordionItem value="prizes" className="border rounded-lg bg-white/80 backdrop-blur-sm shadow-sm">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline text-xs">
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                        <Calendar className="w-3 h-3" />
                        Prêmios
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <p className="text-gray-600 text-xs leading-relaxed">{campaign.prize_description}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            )}
          </div>

          {/* Lado direito - Roda (maior espaço) */}
          <div className="lg:col-span-3 flex justify-center items-start">
            <Card className="shadow-xl p-6 border-0 bg-white/90 backdrop-blur-sm w-full max-w-2xl">
              <div className="flex flex-col items-center">
                {hasAlreadySpun && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg w-full">
                    <p className="text-yellow-700 text-sm font-medium text-center">
                      Você já participou desta campanha!
                    </p>
                  </div>
                )}
                
                <div className="w-full flex justify-center">
                  <SpinWheel
                    prizes={campaign.campaign_prizes.map(prize => ({
                      id: prize.id,
                      name: prize.name,
                      percentage: prize.percentage,
                      couponCode: prize.coupon_code || ''
                    }))}
                    onSpin={hasAlreadySpun ? () => {} : handlePrizeWon}
                    isSpinning={isSpinning}
                    wheelColor={campaign.wheel_color || '#3B82F6'}
                  />
                </div>
                
                {hasAlreadySpun && (
                  <div className="mt-6 w-full">
                    <Button
                      onClick={() => setShowResult(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                    >
                      Ver Meu Prêmio
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {showResult && renderResultPopup()}
    </div>
  );

  return (
    <>
      {showDataForm && renderDataForm()}
      {showWheel && renderWheel()}
    </>
  );
};

export default Campaign;
