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
    console.log('=== CRIANDO PARTICIPAÇÃO ===');
    console.log('Campaign ID:', campaign.id);
    console.log('Email:', email);
    console.log('Limite por email:', campaign.max_uses_per_email);
    
    // Verificar se email já participou (caso-insensitivo)
    if (campaign.max_uses_per_email && campaign.max_uses_per_email > 0) {
      try {
        const { data: existingParticipations, error: countError } = await supabase
          .from('participations')
          .select('*')
          .eq('campaign_id', campaign.id)
          .or(`participant_data->>email.ilike.${email},participant_data->>Email.ilike.${email}`);

        console.log('Participações existentes encontradas:', existingParticipations?.length || 0);

        if (countError) {
          console.error('Erro ao verificar participações:', countError);
          throw new Error('Erro ao verificar participações anteriores');
        }

        if (existingParticipations && existingParticipations.length > 0) {
          console.log('=== EMAIL JÁ PARTICIPOU - VERIFICANDO STATUS ===');
          
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
            
            toast({
              title: 'Bem-vindo de volta!',
              description: 'Você já participou desta campanha. Veja seu prêmio.',
            });
            return lastParticipation;
          }
          
          toast({
            title: 'Email já utilizado',
            description: `Este email já foi usado nesta campanha (limite: ${campaign.max_uses_per_email} uso${campaign.max_uses_per_email > 1 ? 's' : ''}).`,
            variant: 'destructive',
          });
          return null;
        }

      } catch (error: any) {
        console.error('Erro na verificação de email:', error);
        toast({
          title: 'Erro na verificação',
          description: error.message || 'Tente novamente',
          variant: 'destructive',
        });
        return null;
      }
    }

    // Criar nova participação
    try {
      console.log('=== CRIANDO NOVA PARTICIPAÇÃO ===');
      const saoPauloTime = toZonedTime(new Date(), 'America/Sao_Paulo');
      
      const { data: newParticipation, error: insertError } = await supabase
        .from('participations')
        .insert({
          campaign_id: campaign.id,
          participant_data: userData,
          has_spun: false,
          created_at: saoPauloTime.toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir participação:', insertError);
        throw new Error(insertError.message);
      }
      
      console.log('=== PARTICIPAÇÃO CRIADA ===');
      console.log('Nova participação:', newParticipation);
      
      return newParticipation;
      
    } catch (error: any) {
      console.error('Erro ao criar participação:', error);
      toast({
        title: 'Erro ao registrar participação',
        description: error.message || 'Não foi possível registrar sua participação',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handlePrizeWon = async (prize: any) => {
    console.log('=== INÍCIO DO PROCESSAMENTO DE PRÊMIO ===');
    console.log('Prêmio recebido:', prize);
    console.log('Participação atual:', currentParticipation);
    console.log('Já girou antes:', hasAlreadySpun);

    if (!currentParticipation) {
      console.error('=== ERRO: Nenhuma participação encontrada ===');
      toast({
        title: 'Erro',
        description: 'Participação não encontrada. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    if (hasAlreadySpun) {
      console.log('=== JÁ GIROU ANTES - IGNORANDO ===');
      return;
    }

    try {
      console.log('=== SALVANDO PRÊMIO NO BANCO ===');
      setIsSpinning(false);
      
      // Calcular data de expiração
      const expiryDays = campaign?.prize_expiry_days || 30;
      const saoPauloNow = toZonedTime(new Date(), 'America/Sao_Paulo');
      const expiryDate = addDays(saoPauloNow, expiryDays);
      setPrizeExpiryDate(expiryDate);

      // Preparar dados para atualização
      const updateData = {
        has_spun: true,
        prize_won: prize.name || 'Tente Novamente',
        coupon_code: prize.couponCode || null,
        updated_at: saoPauloNow.toISOString()
      };
      
      console.log('Atualizando participação ID:', currentParticipation.id);
      console.log('Dados para atualização:', updateData);
      
      const { data: updatedParticipation, error: updateError } = await supabase
        .from('participations')
        .update(updateData)
        .eq('id', currentParticipation.id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro na atualização:', updateError);
        throw new Error(`Erro ao salvar: ${updateError.message}`);
      }

      console.log('=== PRÊMIO SALVO COM SUCESSO ===');
      console.log('Participação atualizada:', updatedParticipation);
      
      // Atualizar estado local
      setCurrentParticipation(updatedParticipation);
      setWonPrize(prize.name || 'Tente Novamente');
      setWonCoupon(prize.couponCode || '');
      setHasAlreadySpun(true);
      setShowResult(true);
      
      toast({
        title: 'Prêmio registrado!',
        description: `Você ganhou: ${prize.name || 'Tente Novamente'}`,
      });
      
    } catch (error: any) {
      console.error('=== ERRO AO SALVAR PRÊMIO ===');
      console.error('Erro completo:', error);
      
      setIsSpinning(false);
      
      toast({
        title: 'Erro ao salvar prêmio',
        description: error.message || 'Houve um problema ao salvar seu prêmio. Entre em contato conosco.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formElement = e.currentTarget as HTMLFormElement;
      const formDataObject = Object.fromEntries(new FormData(formElement));
      
      console.log('=== FORMULÁRIO ENVIADO ===');
      console.log('Dados do formulário:', formDataObject);
      
      setFormData(formDataObject);

      const participation = await createParticipation(formDataObject);

      if (participation) {
        console.log('=== PARTICIPAÇÃO CRIADA COM SUCESSO ===');
        setCurrentParticipation(participation);
        setShowDataForm(false);
        setShowWheel(true);
      }
    } catch (error: any) {
      console.error('Erro no envio do formulário:', error);
      toast({
        title: 'Erro no formulário',
        description: error.message || 'Erro ao processar formulário',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
              {campaign?.campaign_custom_fields.map(field => (
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
            {campaign?.name}
          </h1>
          <p className="text-gray-600 text-sm">Gire a roda e ganhe prêmios incríveis!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lado esquerdo - Informações em acordeão (menor espaço) */}
          <div className="lg:col-span-1">
            {(campaign?.description || campaign?.rules || campaign?.prize_description) && (
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
                    prizes={campaign?.campaign_prizes.map(prize => ({
                      id: prize.id,
                      name: prize.name,
                      percentage: prize.percentage,
                      couponCode: prize.coupon_code || ''
                    })) || []}
                    onSpin={hasAlreadySpun ? () => {} : handlePrizeWon}
                    isSpinning={isSpinning}
                    wheelColor={campaign?.wheel_color || '#3B82F6'}
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Campanha não encontrada</h2>
          <p className="text-gray-600">Esta campanha não existe ou não está mais ativa.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showDataForm && renderDataForm()}
      {showWheel && renderWheel()}
    </>
  );
};

export default Campaign;
