
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SpinWheel from '@/components/SpinWheel';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Trophy, X, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center shadow-xl">
          <CardContent className="p-8">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600">Campanha não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createParticipation = async (userData: any) => {
    if (!campaign) return null;

    const email = userData.email || userData.Email;
    
    // Verificar limite de participações por email
    if (campaign.max_uses_per_email && campaign.max_uses_per_email > 0) {
      const { count } = await supabase
        .from('participations')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .contains('participant_data', { email });

      if (count && count >= campaign.max_uses_per_email) {
        toast({
          title: 'Limite atingido',
          description: `Você já atingiu o limite de ${campaign.max_uses_per_email} participação(ões) por email.`,
          variant: 'destructive',
        });
        setHasAlreadySpun(true);
        return null;
      }
    }

    try {
      const { data, error } = await supabase
        .from('participations')
        .insert({
          campaign_id: campaign.id,
          participant_data: userData,
          has_spun: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating participation:', error);
      toast({
        title: 'Erro ao registrar participação',
        description: 'Tente novamente em alguns instantes',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handlePrizeWon = async (prize: any) => {
    if (!currentParticipation || hasAlreadySpun) return;

    console.log('Prize won:', { prizeName: prize.name, couponCode: prize.couponCode, participationId: currentParticipation.id });
    setIsSpinning(false);

    // Calcular data de expiração do prêmio
    const expiryDays = campaign?.prize_expiry_days || 30;
    const expiryDate = addDays(new Date(), expiryDays);
    setPrizeExpiryDate(expiryDate);

    try {
      const { error } = await supabase
        .from('participations')
        .update({
          has_spun: true,
          prize_won: prize.name,
          coupon_code: prize.couponCode || null
        })
        .eq('id', currentParticipation.id);

      if (error) throw error;

      console.log('Participation updated successfully');
      
      // Atualizar o estado local
      setCurrentParticipation({
        ...currentParticipation,
        has_spun: true,
        prize_won: prize.name,
        coupon_code: prize.couponCode || null
      });

      setWonPrize(prize.name);
      setWonCoupon(prize.couponCode || '');
      setHasAlreadySpun(true);
      setShowResult(true);
    } catch (error) {
      console.error('Error updating participation:', error);
      toast({
        title: 'Erro ao salvar resultado',
        description: 'O resultado foi registrado, mas houve um problema ao salvar',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
    setFormData(data);

    const participation = await createParticipation(data);

    if (participation) {
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

  const renderResultPopup = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md text-center shadow-2xl animate-scale-in border-0 bg-white">
        <CardHeader className="pb-4 relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 p-1 h-8 w-8 hover:bg-white/50"
            onClick={() => setShowResult(false)}
          >
            <X className="h-4 w-4" />
          </Button>
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
                  Válido até: {format(prizeExpiryDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {campaign?.thank_you_message && (
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{campaign.thank_you_message}</p>
            )}
            
            {getWhatsAppLink() && wonPrize !== 'Tente Novamente' && (
              <Button
                onClick={() => window.open(getWhatsAppLink(), '_blank')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                🎁 Resgatar Prêmio
              </Button>
            )}

            <Button
              onClick={() => setShowResult(false)}
              variant="outline"
              className="w-full border-gray-200 hover:bg-gray-50"
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWheel = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Campaign Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {campaign.name}
          </h1>
          <p className="text-gray-600">Gire a roda e ganhe prêmios incríveis!</p>
        </div>

        {/* Campaign Information Cards */}
        {(campaign.description || campaign.rules || campaign.prize_description) && (
          <div className="space-y-4 mb-8">
            {campaign.description && (
              <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Gift className="w-5 h-5 text-blue-600" />
                    Sobre a Campanha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">{campaign.description}</p>
                </CardContent>
              </Card>
            )}
            
            {campaign.rules && (
              <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-blue-600" />
                    Regras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{campaign.rules}</div>
                </CardContent>
              </Card>
            )}
            
            {campaign.prize_description && (
              <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Descrição dos Prêmios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">{campaign.prize_description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Wheel Section */}
        <div className="flex justify-center">
          <Card className="shadow-xl p-6 border-0 bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              {hasAlreadySpun && (
                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-sm font-medium text-center">
                    Você já participou desta campanha!
                  </p>
                </div>
              )}
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
          </Card>
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
