
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface PrizeExpiryConfigProps {
  prizeExpiryDays: number;
  setPrizeExpiryDays: (days: number) => void;
}

const PrizeExpiryConfig = ({ prizeExpiryDays, setPrizeExpiryDays }: PrizeExpiryConfigProps) => {
  const [customDays, setCustomDays] = useState(prizeExpiryDays > 30 ? prizeExpiryDays : 30);

  const handleExpiryChange = (value: string) => {
    if (value === 'custom') {
      setPrizeExpiryDays(customDays);
    } else {
      setPrizeExpiryDays(parseInt(value));
    }
  };

  const handleCustomDaysChange = (days: number) => {
    setCustomDays(days);
    if (prizeExpiryDays > 30 || getCurrentOption() === 'custom') {
      setPrizeExpiryDays(days);
    }
  };

  const getCurrentOption = () => {
    if (prizeExpiryDays === 7) return '7';
    if (prizeExpiryDays === 14) return '14';
    if (prizeExpiryDays === 30) return '30';
    return 'custom';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prizeExpiry">Prazo Limite para Utilização dos Prêmios</Label>
        <Select value={getCurrentOption()} onValueChange={handleExpiryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="14">14 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {getCurrentOption() === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="customDays">Número de dias</Label>
          <Input
            type="number"
            id="customDays"
            placeholder="Ex: 60"
            value={customDays}
            onChange={(e) => handleCustomDaysChange(parseInt(e.target.value) || 30)}
            min="1"
            max="365"
          />
        </div>
      )}

      <p className="text-sm text-gray-500">
        Os participantes terão {prizeExpiryDays} dias para resgatar seus prêmios após ganhá-los.
      </p>
    </div>
  );
};

export default PrizeExpiryConfig;
