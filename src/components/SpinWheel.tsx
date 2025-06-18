import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface Prize {
  id: string;
  name: string;
  percentage: number;
  couponCode: string;
}

interface SpinWheelProps {
  prizes: Prize[];
  onSpin: (prize: Prize) => void;
  isSpinning: boolean;
  wheelColor: string;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ prizes, onSpin, isSpinning, wheelColor }) => {
  const [finalRotation, setFinalRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = () => {
    if (isSpinning || isAnimating) return;

    setIsAnimating(true);

    // Calcular qual prêmio foi sorteado baseado nas porcentagens
    const random = Math.random() * 100;
    let accumulator = 0;
    let selectedPrize = prizes[0];
    let selectedIndex = 0;

    for (let i = 0; i < prizes.length; i++) {
      accumulator += prizes[i].percentage;
      if (random <= accumulator) {
        selectedPrize = prizes[i];
        selectedIndex = i;
        break;
      }
    }

    // Calcular rotação para parar no prêmio sorteado
    const sectionAngle = 360 / prizes.length;
    
    // O ponteiro está no topo (0°) apontando para baixo
    // Queremos que o centro do prêmio sorteado fique exatamente sob o ponteiro
    
    // Posição do centro de cada seção (em graus)
    const prizeCenter = selectedIndex * sectionAngle + (sectionAngle / 2);
    
    // Pequena variação aleatória para parecer natural
    const randomOffset = (Math.random() - 0.5) * (sectionAngle * 0.1);
    
    // Ângulo final onde queremos parar (topo = 0°)
    const targetAngle = prizeCenter + randomOffset;
    
    // Múltiplas voltas completas
    const minSpins = 5;
    const maxSpins = 7;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const totalSpinsDegrees = spins * 360;
    
    // Para parar no prêmio correto, giramos até que esse prêmio esteja no topo
    // Como giramos no sentido horário, subtraímos o ângulo do prêmio
    const totalRotation = totalSpinsDegrees - targetAngle;
    setFinalRotation(totalRotation);

    // Chamar callback após a animação
    setTimeout(() => {
      setIsAnimating(false);
      onSpin(selectedPrize);
    }, 4000);
  };

  const sectionAngle = 360 / prizes.length;

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-96 h-96">
        {/* Roda - usando a mesma estrutura da HeroSection mas com prêmios reais */}
        <div 
          ref={wheelRef}
          className={`relative w-96 h-96 rounded-full border-8 border-white shadow-2xl ${
            isAnimating ? 'duration-[4000ms] ease-out' : ''
          }`}
          style={{ 
            transform: `rotate(${finalRotation}deg)`,
            background: 'white',
            transition: isAnimating ? 'transform 4000ms cubic-bezier(0.23, 1, 0.32, 1)' : 'none'
          }}
        >
          {prizes.map((prize, index) => {
            // Ajustar os ângulos para que o primeiro prêmio fique alinhado com o ponteiro (topo)
            const startAngle = index * sectionAngle;
            const endAngle = (index + 1) * sectionAngle;
            
            // Cores mais vibrantes e contrastantes
            const colors = [
              '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
              '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
              '#FF8A80', '#80CBC4', '#81C784', '#FFB74D'
            ];
            const backgroundColor = colors[index % colors.length];

            // Calcular pontos para criar fatias circulares perfeitas
            // Começar do topo (12h) e ir no sentido horário
            const centerX = 50;
            const centerY = 50;
            const radius = 50;
            
            // Ajustar para que o primeiro prêmio comece no topo (0°)
            const startAngleRad = (startAngle) * Math.PI / 180;
            const endAngleRad = (endAngle) * Math.PI / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = sectionAngle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            return (
              <div key={prize.id} className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <path
                    d={pathData}
                    fill={backgroundColor}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </svg>
                
                {/* Texto do prêmio */}
                <div 
                  className="absolute text-center font-bold text-white text-sm leading-tight pointer-events-none"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${startAngle + sectionAngle / 2}deg) translateY(-120px)`,
                    width: '140px'
                  }}
                >
                  <div 
                    style={{ 
                      transform: `rotate(${-(startAngle + sectionAngle / 2)}deg)`,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    <div className="text-xs font-semibold">
                      {prize.name.length > 18 ? prize.name.substring(0, 18) + '...' : prize.name}
                    </div>
                    <div className="text-xs mt-1 opacity-90">{prize.percentage}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Centro da roda com ícone do presente e ponteiro */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Ponteiro vermelho apontando para baixo */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-30">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg"></div>
          </div>
          
          {/* Centro da roda */}
          <div className="relative w-20 h-20 bg-white rounded-full border-4 border-gray-400 flex items-center justify-center shadow-lg z-20">
            <div className="text-3xl">🎁</div>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSpin} 
        disabled={isSpinning || isAnimating}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg disabled:opacity-50"
      >
        {isAnimating ? 'Girando...' : 'Girar a Roda!'}
      </Button>
    </div>
  );
};

export default SpinWheel;
