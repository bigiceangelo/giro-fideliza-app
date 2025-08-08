import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SpinWheel from '@/components/SpinWheel';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Star, Trophy, Sparkles } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-brand-blue/10 via-white to-brand-lime/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-blue/10 via-white to-brand-lime/10 flex items-center justify-center">
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
    if (!currentParticipation) return;

    console.log('Prize won:', { prizeName: prize.name, couponCode: prize.couponCode, participationId: currentParticipation.id });

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

      setShowResult(true);
      setWonPrize(prize.name);
      setWonCoupon(prize.couponCode || '');
      setIsSpinning(false);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-blue/10 via-white to-brand-lime/10 p-4">
      <div className="w-full max-w-md">
        {/* Header with sparkles */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-lime rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Participe da Nossa Campanha!</h2>
          <p className="text-gray-600">Preencha seus dados para concorrer aos prêmios incríveis</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {campaign.campaign_custom_fields.map(field => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.name} className="text-sm font-semibold text-gray-700">
                    {field.name} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="h-12 border-2 border-gray-200 focus:border-brand-blue transition-colors"
                  />
                </div>
              ))}
              <Button 
                disabled={isLoading} 
                className="w-full h-12 bg-gradient-to-r from-brand-blue to-brand-lime hover:from-blue-600 hover:to-green-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Enviando...
                  </div>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Participar Agora
                  </>
                )}
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

  const renderResult = () => (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue/10 via-white to-brand-lime/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-2xl border-0 bg-white/90 backdrop-blur-sm animate-bounce-in">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-gold to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-transparent bg-gradient-to-r from-brand-blue to-brand-lime bg-clip-text">
            🎉 Parabéns!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-lg text-gray-600 mb-2">Você ganhou:</p>
            <div className="bg-gradient-to-br from-brand-blue/10 to-brand-lime/10 p-6 rounded-2xl border-2 border-dashed border-brand-blue/30">
              <p className="text-2xl font-bold text-brand-blue">{wonPrize}</p>
            </div>
          </div>
          
          {wonCoupon && (
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Código do cupom:</p>
              <div className="bg-white p-3 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-xl font-mono font-bold text-gray-800">{wonCoupon}</p>
              </div>
            </div>
          )}
          
          <div className="pt-4 space-y-4">
            {campaign?.thank_you_message && (
              <p className="text-gray-600 leading-relaxed">{campaign.thank_you_message}</p>
            )}
            
            {getWhatsAppLink() && wonPrize !== 'Tente Novamente' && (
              <Button
                onClick={() => window.open(getWhatsAppLink(), '_blank')}
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                🎁 Resgatar Prêmio
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWheel = () => (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue/10 via-white to-brand-lime/10 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Campaign Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-brand-blue to-brand-lime bg-clip-text mb-4">
            {campaign.name}
          </h1>
          <div className="flex items-center justify-center gap-2 text-brand-blue">
            <Star className="w-5 h-5" />
            <span className="text-lg font-semibold">Gire a roda e ganhe prêmios incríveis!</span>
            <Star className="w-5 h-5" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Prizes (if enabled) */}
          {campaign.show_prizes && (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  <Gift className="w-6 h-6 text-brand-blue" />
                  Prêmios Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaign.campaign_prizes.map((prize, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                      <div className="w-3 h-3 bg-gradient-to-r from-brand-blue to-brand-lime rounded-full"></div>
                      <span className="font-medium text-gray-700">{prize.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Right side - Wheel */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue/20 to-brand-lime/20 rounded-full blur-xl"></div>
              <div className="relative bg-white p-6 rounded-full shadow-2xl">
                <SpinWheel
                  prizes={campaign.campaign_prizes.map(prize => ({
                    id: prize.id,
                    name: prize.name,
                    percentage: prize.percentage,
                    couponCode: prize.coupon_code || ''
                  }))}
                  onSpin={handlePrizeWon}
                  isSpinning={isSpinning}
                  wheelColor={campaign.wheel_color || '#3B82F6'}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Campaign Information */}
        {(campaign.description || campaign.rules || campaign.prize_description) && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {campaign.description && (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-brand-blue">Sobre a Campanha</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{campaign.description}</p>
                </CardContent>
              </Card>
            )}
            
            {campaign.rules && (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-brand-blue">Regras</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{campaign.rules}</p>
                </CardContent>
              </Card>
            )}
            
            {campaign.prize_description && (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-brand-blue">Descrição dos Prêmios</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{campaign.prize_description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {showDataForm && renderDataForm()}
      {showWheel && renderWheel()}
      {showResult && renderResult()}
    </>
  );
};

export default Campaign;
