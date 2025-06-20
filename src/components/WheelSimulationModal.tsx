
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SpinWheel from './SpinWheel';

interface Prize {
  id: string;
  name: string;
  percentage: number;
  couponCode: string;
}

interface WheelSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  prizes: Prize[];
  wheelColor: string;
}

const WheelSimulationModal = ({ 
  isOpen, 
  onClose, 
  campaignName, 
  prizes, 
  wheelColor 
}: WheelSimulationModalProps) => {
  const handleSpin = (prize: Prize) => {
    // Apenas simulação, não salva dados
    console.log('Simulação - Prêmio ganho:', prize.name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Simulação da Roda - {campaignName}</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <SpinWheel
            prizes={prizes}
            onSpin={handleSpin}
            isSpinning={false}
            wheelColor={wheelColor}
          />
        </div>
        
        <p className="text-center text-sm text-gray-500">
          Esta é apenas uma simulação. Os resultados não são salvos.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WheelSimulationModal;
