import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import WheelComponent from 'react-wheel-of-prizes';
import { supabase } from '@/integrations/supabase/client';

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
    return <div className="text-center">Carregando...</div>;
  }

  if (!campaign) {
    return <div className="text-center">Campanha não encontrada.</div>;
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

  const handlePrizeWon = async (prizeName: string, couponCode?: string) => {
    if (!currentParticipation) return;

    console.log('Prize won:', { prizeName, couponCode, participationId: currentParticipation.id });

    try {
      const { error } = await supabase
        .from('participations')
        .update({
          has_spun: true,
          prize_won: prizeName,
          coupon_code: couponCode || null
        })
        .eq('id', currentParticipation.id);

      if (error) throw error;

      console.log('Participation updated successfully');
      
      // Atualizar o estado local
      setCurrentParticipation({
        ...currentParticipation,
        has_spun: true,
        prize_won: prizeName,
        coupon_code: couponCode || null
      });

      setShowResult(true);
      setWonPrize(prizeName);
      setWonCoupon(couponCode || '');
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Participe da nossa campanha!</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {campaign.campaign_custom_fields.map(field => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.name}>{field.name} {field.required && '*'}</Label>
              <Input
                type={field.type}
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
              />
            </div>
          ))}
          <Button disabled={isLoading} className="w-full bg-brand-blue hover:bg-blue-600">
            {isLoading ? 'Enviando...' : 'Participar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const getWhatsAppLink = () => {
    if (!campaign?.whatsapp_number || !campaign?.whatsapp_message) {
      return null;
    }
    
    const encodedMessage = encodeURIComponent(campaign.whatsapp_message);
    return `https://wa.me/${campaign.whatsapp_number}?text=${encodedMessage}`;
  };

  const renderResult = () => (
    <Card className="w-full max-w-md mx-auto text-center">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-green-600">
          🎉 Parabéns!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg">Você ganhou:</p>
        <p className="text-2xl font-bold text-brand-blue">{wonPrize}</p>
        
        {wonCoupon && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Código do cupom:</p>
            <p className="text-xl font-mono font-bold">{wonCoupon}</p>
          </div>
        )}
        
        <div className="pt-4">
          <p className="text-gray-600 mb-4">{campaign?.thank_you_message}</p>
          
          {getWhatsAppLink() && wonPrize !== 'Tente Novamente' && (
            <Button
              onClick={() => window.open(getWhatsAppLink(), '_blank')}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              🎁 Resgatar Prêmio
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const wheelSegments = campaign.campaign_prizes.map(prize => prize.name);
  const wheelColors = ['#F0F8FF', '#E6E6FA', '#D8BFD8', '#DDA0DD', '#EE82EE', '#DA70D6', '#FF00FF', '#BA55D3', '#9370DB', '#8A2BE2', '#7B68EE', '#6A5ACD', '#483D8B', '#000080', '#191970'];
  const onFinished = (prize: string) => {
    const wonPrizeData = campaign.campaign_prizes.find(p => p.name === prize);
    handlePrizeWon(prize, wonPrizeData?.coupon_code);
  };

  const renderWheel = () => (
    <div className="flex flex-col items-center">
      {campaign.show_prizes && (
        <Card className="mb-4">
          <CardContent>
            <h3 className="font-semibold mb-2">Prêmios:</h3>
            <ul className="list-disc pl-5">
              {campaign.campaign_prizes.map((prize, index) => (
                <li key={index}>{prize.name}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <WheelComponent
        segments={wheelSegments}
        segColors={wheelColors}
        onFinished={onFinished}
        primaryColor={campaign.wheel_color || '#3B82F6'}
        contrastColor={'white'}
        buttonText={'Girar!'}
        isOnlyOnce={true}
        size={290}
        upDuration={500}
        downDuration={600}
        fontFamily="Arial"
      />
      {campaign.description && (
        <Card className="mt-4">
          <CardContent>
            <h3 className="font-semibold mb-2">Sobre a Campanha:</h3>
            <p>{campaign.description}</p>
            {campaign.rules && (
              <>
                <h3 className="font-semibold mt-4 mb-2">Regras:</h3>
                <p>{campaign.rules}</p>
              </>
            )}
            {campaign.prize_description && (
              <>
                <h3 className="font-semibold mt-4 mb-2">Descrição dos Prêmios:</h3>
                <p>{campaign.prize_description}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">{campaign.name}</h1>
        
        {showDataForm && renderDataForm()}
        {showWheel && renderWheel()}
        {showResult && renderResult()}
      </div>
    </div>
  );
};

export default Campaign;
