
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';

interface CampaignStep2Props {
  description: string;
  setDescription: (value: string) => void;
  rules: string;
  setRules: (value: string) => void;
  prizeDescription: string;
  setPrizeDescription: (value: string) => void;
  showPrizes: boolean;
  setShowPrizes: (value: boolean) => void;
  wheelColor: string;
  setWheelColor: (value: string) => void;
  thankYouMessage: string;
  setThankYouMessage: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const CampaignStep2 = ({
  description,
  setDescription,
  rules,
  setRules,
  prizeDescription,
  setPrizeDescription,
  showPrizes,
  setShowPrizes,
  wheelColor,
  setWheelColor,
  thankYouMessage,
  setThankYouMessage,
  onNext,
  onBack,
}: CampaignStep2Props) => {
  const canProceed = () => {
    return description.trim() !== '' && thankYouMessage.trim() !== '';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Passo 2: Descrições e Configurações</h2>
        <p className="text-gray-600">Configure as descrições e aparência da campanha</p>
      </div>

      {/* Descrição da Campanha */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição da Campanha</Label>
        <Textarea
          id="description"
          placeholder="Descreva sua campanha de forma atrativa para os participantes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </div>

      {/* Regras da Campanha */}
      <div className="space-y-2">
        <Label htmlFor="rules">Regras da Campanha</Label>
        <Textarea
          id="rules"
          placeholder="• Cada participante pode girar apenas uma vez&#10;• Válido até dd/mm/aaaa&#10;• Prêmios sujeitos a disponibilidade..."
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={6}
        />
      </div>

      {/* Descrição dos Prêmios */}
      <div className="space-y-2">
        <Label htmlFor="prizeDescription">Descrição dos Prêmios</Label>
        <Textarea
          id="prizeDescription"
          placeholder="Descreva os prêmios disponíveis, como resgatar, validade dos cupons, etc..."
          value={prizeDescription}
          onChange={(e) => setPrizeDescription(e.target.value)}
          rows={4}
        />
      </div>

      {/* Configuração de Exibição de Prêmios */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="showPrizes"
            checked={showPrizes}
            onCheckedChange={setShowPrizes}
          />
          <Label htmlFor="showPrizes">
            Mostrar prêmios possíveis aos participantes (sem mostrar probabilidades)
          </Label>
        </div>
        <p className="text-sm text-gray-500">
          Se ativado, os participantes verão uma lista dos prêmios disponíveis, mas não as chances de cada um.
        </p>
      </div>

      {/* Cor da Roda */}
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
            placeholder="#007BFF"
          />
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
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
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

export default CampaignStep2;
