
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';

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

interface CampaignStep1Props {
  campaignName: string;
  setCampaignName: (name: string) => void;
  prizes: Prize[];
  setPrizes: (prizes: Prize[]) => void;
  customFields: CustomField[];
  setCustomFields: (fields: CustomField[]) => void;
  collectDataBefore: boolean;
  setCollectDataBefore: (value: boolean) => void;
  maxUsesPerEmail: number;
  setMaxUsesPerEmail: (value: number) => void;
  onNext: () => void;
}

const CampaignStep1 = ({
  campaignName,
  setCampaignName,
  prizes,
  setPrizes,
  customFields,
  setCustomFields,
  collectDataBefore,
  setCollectDataBefore,
  maxUsesPerEmail,
  setMaxUsesPerEmail,
  onNext,
}: CampaignStep1Props) => {
  const addPrize = () => {
    const newPrize: Prize = {
      id: Date.now().toString(),
      name: '',
      percentage: 0,
      couponCode: ''
    };
    setPrizes([...prizes, newPrize]);
  };

  const removePrize = (id: string) => {
    setPrizes(prizes.filter(prize => prize.id !== id));
  };

  const updatePrize = (id: string, field: keyof Prize, value: string | number) => {
    setPrizes(prizes.map(prize => 
      prize.id === id ? { ...prize, [field]: value } : prize
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

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  const updateCustomField = (id: string, field: keyof CustomField, value: string | boolean) => {
    setCustomFields(customFields.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const getTotalPercentage = () => {
    return prizes.reduce((total, prize) => total + prize.percentage, 0);
  };

  const canProceed = () => {
    return (
      campaignName.trim() !== '' &&
      getTotalPercentage() === 100 &&
      prizes.every(prize => prize.name.trim() !== '') &&
      customFields.every(field => field.name.trim() !== '') &&
      maxUsesPerEmail > 0
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Passo 1: Configuração Básica</h2>
        <p className="text-gray-600">Configure os dados básicos da sua campanha</p>
      </div>

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

      {/* Limite de Usos por Email */}
      <div className="space-y-2">
        <Label htmlFor="maxUsesPerEmail">Máximo de participações por email</Label>
        <Input
          id="maxUsesPerEmail"
          type="number"
          placeholder="1"
          value={maxUsesPerEmail}
          onChange={(e) => setMaxUsesPerEmail(parseInt(e.target.value) || 1)}
          min="1"
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
                value={prize.couponCode}
                onChange={(e) => updatePrize(prize.id, 'couponCode', e.target.value)}
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

      {/* Configuração de Coleta de Dados */}
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

      <div className="flex justify-end">
        <Button 
          onClick={onNext}
          disabled={!canProceed()}
          className="bg-brand-blue hover:bg-blue-600"
        >
          Próximo Passo
        </Button>
      </div>
    </div>
  );
};

export default CampaignStep1;
