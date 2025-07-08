
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Prize {
  id: string;
  name: string;
  percentage: number;
  coupon_code: string;
}

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date';
  required: boolean;
  placeholder: string;
}

const EditCampaign = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [campaignName, setCampaignName] = useState('');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [collectDataBefore, setCollectDataBefore] = useState(true);
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [wheelColor, setWheelColor] = useState('#3B82F6');
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !id) {
      navigate('/dashboard');
      return;
    }
    loadCampaign();
  }, [user, id, navigate]);

  const loadCampaign = async () => {
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (campaignError) throw campaignError;

      if (!campaign) {
        toast({
          title: 'Campanha não encontrada',
          description: 'Redirecionando para o dashboard',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setCampaignName(campaign.name);
      setCollectDataBefore(campaign.collect_data_before ?? true);
      setThankYouMessage(campaign.thank_you_message || '');
      setWheelColor(campaign.wheel_color || '#3B82F6');

      // Carregar prêmios
      const { data: prizesData, error: prizesError } = await supabase
        .from('campaign_prizes')
        .select('*')
        .eq('campaign_id', id);

      if (prizesError) throw prizesError;

      const transformedPrizes = (prizesData || []).map(prize => ({
        id: prize.id,
        name: prize.name,
        percentage: prize.percentage,
        coupon_code: prize.coupon_code || ''
      }));
      setPrizes(transformedPrizes);

      // Carregar campos personalizados
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('campaign_custom_fields')
        .select('*')
        .eq('campaign_id', id);

      if (fieldsError) throw fieldsError;

      const transformedFields = (fieldsData || []).map(field => ({
        id: field.id,
        name: field.name,
        type: field.type as 'text' | 'email' | 'phone' | 'number' | 'date',
        required: field.required || false,
        placeholder: field.placeholder || ''
      }));

      if (transformedFields.length === 0) {
        setCustomFields([
          { id: '1', name: 'Nome', type: 'text', required: true, placeholder: 'Seu nome completo' },
          { id: '2', name: 'Email', type: 'email', required: true, placeholder: 'seu@email.com' },
          { id: '3', name: 'WhatsApp', type: 'phone', required: true, placeholder: '(11) 99999-9999' }
        ]);
      } else {
        setCustomFields(transformedFields);
      }

    } catch (error: any) {
      console.error('Error loading campaign:', error);
      toast({
        title: 'Erro ao carregar campanha',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const addPrize = () => {
    const newPrize: Prize = {
      id: Date.now().toString(),
      name: '',
      percentage: 0,
      coupon_code: ''
    };
    setPrizes([...prizes, newPrize]);
  };

  const removePrize = (prizeId: string) => {
    setPrizes(prizes.filter(prize => prize.id !== prizeId));
  };

  const updatePrize = (prizeId: string, field: keyof Prize, value: string | number) => {
    setPrizes(prizes.map(prize => 
      prize.id === prizeId ? { ...prize, [field]: value } : prize
    ));
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setCustomFields([...customFields, newField]);
  };

  const removeCustomField = (fieldId: string) => {
    setCustomFields(customFields.filter(field => field.id !== fieldId));
  };

  const updateCustomField = (fieldId: string, field: keyof CustomField, value: string | boolean) => {
    setCustomFields(customFields.map(f => 
      f.id === fieldId ? { ...f, [field]: value } : f
    ));
  };

  const getTotalPercentage = () => {
    return prizes.reduce((total, prize) => total + prize.percentage, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validações
    if (getTotalPercentage() !== 100) {
      toast({
        title: 'Erro na configuração',
        description: 'A soma das porcentagens deve ser exatamente 100%',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (prizes.some(prize => !prize.name.trim())) {
      toast({
        title: 'Erro na configuração',
        description: 'Todos os prêmios devem ter um nome',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (customFields.some(field => !field.name.trim())) {
      toast({
        title: 'Erro na configuração',
        description: 'Todos os campos personalizados devem ter um nome',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      // Atualizar campanha
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({
          name: campaignName,
          collect_data_before: collectDataBefore,
          thank_you_message: thankYouMessage,
          wheel_color: wheelColor,
        })
        .eq('id', id);

      if (campaignError) throw campaignError;

      // Deletar prêmios existentes e criar novos
      await supabase.from('campaign_prizes').delete().eq('campaign_id', id);
      
      if (prizes.length > 0) {
        const prizesToInsert = prizes.map(prize => ({
          campaign_id: id,
          name: prize.name,
          percentage: prize.percentage,
          coupon_code: prize.coupon_code || null
        }));

        const { error: prizesError } = await supabase
          .from('campaign_prizes')
          .insert(prizesToInsert);

        if (prizesError) throw prizesError;
      }

      // Deletar campos personalizados existentes e criar novos
      await supabase.from('campaign_custom_fields').delete().eq('campaign_id', id);
      
      if (customFields.length > 0) {
        const fieldsToInsert = customFields.map(field => ({
          campaign_id: id,
          name: field.name,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || null
        }));

        const { error: fieldsError } = await supabase
          .from('campaign_custom_fields')
          .insert(fieldsToInsert);

        if (fieldsError) throw fieldsError;
      }

      toast({
        title: 'Campanha atualizada com sucesso!',
        description: 'As alterações foram salvas',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      toast({
        title: 'Erro ao atualizar campanha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-blue"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

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
              <CardTitle className="text-2xl">Editar Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome da Campanha */}
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Nome da Campanha</Label>
                  <Input
                    id="campaignName"
                    placeholder="Ex: Promoção de Verão 2024"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    required
                  />
                </div>

                {/* Campos Personalizados */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Campos de Coleta de Dados</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Campo
                    </Button>
                  </div>
                  
                  {customFields.map((field) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label className="text-sm text-gray-600">Nome do Campo</Label>
                        <Input
                          placeholder="Nome do campo"
                          value={field.name}
                          onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Tipo</Label>
                        <Select value={field.type} onValueChange={(value) => updateCustomField(field.id, 'type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Placeholder</Label>
                        <Input
                          placeholder={field.type === 'date' ? 'Ex: Data de nascimento' : 'Texto de ajuda'}
                          value={field.placeholder}
                          onChange={(e) => updateCustomField(field.id, 'placeholder', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateCustomField(field.id, 'required', checked)}
                          />
                          <Label className="text-sm">Obrigatório</Label>
                        </div>
                      </div>
                      <div className="flex items-end">
                        {customFields.length > 1 && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeCustomField(field.id)}
                            className="w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prêmios */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Prêmios da Roda</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPrize}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Prêmio
                    </Button>
                  </div>
                  
                  {prizes.map((prize) => (
                    <div key={prize.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label className="text-sm text-gray-600">Nome do Prêmio</Label>
                        <Input
                          placeholder="Nome do prêmio"
                          value={prize.name}
                          onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">% Chance</Label>
                        <Input
                          type="number"
                          placeholder="% Chance"
                          value={prize.percentage}
                          onChange={(e) => updatePrize(prize.id, 'percentage', parseInt(e.target.value) || 0)}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Código do Cupom</Label>
                        <Input
                          placeholder="Ex: DESC10"
                          value={prize.coupon_code}
                          onChange={(e) => updatePrize(prize.id, 'coupon_code', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        {prizes.length > 1 && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removePrize(prize.id)}
                            className="w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-sm text-gray-600">
                    Total: {getTotalPercentage()}% 
                    {getTotalPercentage() !== 100 && (
                      <span className="text-red-500 ml-2">
                        (Deve somar 100%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Configurações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="collectDataBefore"
                        checked={collectDataBefore}
                        onCheckedChange={setCollectDataBefore}
                      />
                      <Label htmlFor="collectDataBefore">
                        Coletar dados antes do giro
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wheelColor">Cor da Roda</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          id="wheelColor"
                          value={wheelColor}
                          onChange={(e) => setWheelColor(e.target.value)}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={wheelColor}
                          onChange={(e) => setWheelColor(e.target.value)}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mensagem de Agradecimento */}
                <div className="space-y-2">
                  <Label htmlFor="thankYouMessage">Mensagem de Agradecimento</Label>
                  <Textarea
                    id="thankYouMessage"
                    placeholder="Mensagem que aparecerá após o giro"
                    value={thankYouMessage}
                    onChange={(e) => setThankYouMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-brand-blue hover:bg-blue-600"
                    disabled={isLoading || getTotalPercentage() !== 100}
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditCampaign;
