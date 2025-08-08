
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

interface CampaignStep3Props {
  whatsappNumber: string;
  setWhatsappNumber: (value: string) => void;
  whatsappMessage: string;
  setWhatsappMessage: (value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const CampaignStep3 = ({
  whatsappNumber,
  setWhatsappNumber,
  whatsappMessage,
  setWhatsappMessage,
  isLoading,
  onSubmit,
  onBack,
}: CampaignStep3Props) => {
  const canSubmit = () => {
    return whatsappNumber.trim() !== '' && whatsappMessage.trim() !== '';
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se não começar com 55 (código do Brasil), adiciona
    if (!cleaned.startsWith('55') && cleaned.length >= 10) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas números, espaços, parênteses, traços e o sinal de +
    const formatted = value.replace(/[^\d\s()\-+]/g, '');
    setWhatsappNumber(formatted);
  };

  const getWhatsAppPreview = () => {
    const formattedPhone = formatPhoneNumber(whatsappNumber);
    const encodedMessage = encodeURIComponent(whatsappMessage);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Passo 3: Configuração do WhatsApp</h2>
        <p className="text-gray-600">Configure o resgate de prêmios via WhatsApp</p>
      </div>

      {/* Número do WhatsApp */}
      <div className="space-y-2">
        <Label htmlFor="whatsappNumber">Número do WhatsApp</Label>
        <Input
          id="whatsappNumber"
          placeholder="Ex: (11) 99999-9999 ou +55 11 99999-9999"
          value={whatsappNumber}
          onChange={handlePhoneChange}
          required
        />
        <p className="text-sm text-gray-500">
          Digite o número completo com DDD. O código do país (+55) será adicionado automaticamente se necessário.
        </p>
      </div>

      {/* Mensagem do WhatsApp */}
      <div className="space-y-2">
        <Label htmlFor="whatsappMessage">Mensagem para Resgate</Label>
        <Textarea
          id="whatsappMessage"
          placeholder="Ex: Olá! Ganhei um prêmio na sua promoção e gostaria de resgatar..."
          value={whatsappMessage}
          onChange={(e) => setWhatsappMessage(e.target.value)}
          rows={4}
          required
        />
        <p className="text-sm text-gray-500">
          Esta mensagem será enviada automaticamente quando o participante clicar no botão "Resgatar Prêmio".
        </p>
      </div>

      {/* Preview da URL do WhatsApp */}
      {whatsappNumber && whatsappMessage && (
        <div className="space-y-2">
          <Label>Preview do Link do WhatsApp:</Label>
          <div className="p-3 bg-gray-100 rounded-lg break-all text-sm">
            {getWhatsAppPreview()}
          </div>
          <p className="text-sm text-gray-500">
            Este será o link gerado quando o participante clicar no botão de resgate.
          </p>
        </div>
      )}

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
          onClick={onSubmit}
          disabled={!canSubmit() || isLoading}
          className="bg-brand-blue hover:bg-blue-600"
        >
          {isLoading ? 'Criando Campanha...' : 'Criar Campanha'}
        </Button>
      </div>
    </div>
  );
};

export default CampaignStep3;
