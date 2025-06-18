
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
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = () => {
    if (isSpinning) return;

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
    // O ponteiro está no topo (12h), então calculamos para que aponte para o prêmio
    const targetAngle = selectedIndex * sectionAngle + (sectionAngle / 2);
    // Múltiplas voltas completas + ajuste fino para parar no prêmio correto
    const minSpins = 8;
    const maxSpins = 12;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const finalRotation = rotation + (spins * 360) + (360 - targetAngle);

    setRotation(finalRotation);

    // Chamar callback após a animação
    setTimeout(() => {
      onSpin(selectedPrize);
    }, 4000);
  };

  const sectionAngle = 360 / prizes.length;

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-96 h-96">
        {/* Roda */}
        <div 
          ref={wheelRef}
          className="relative w-96 h-96 rounded-full border-8 border-white shadow-2xl"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            background: 'white',
            transition: isSpinning ? 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'
          }}
        >
          {prizes.map((prize, index) => {
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
            const centerX = 50;
            const centerY = 50;
            const radius = 50;
            
            const startAngleRad = (startAngle - 90) * Math.PI / 180;
            const endAngleRad = (endAngle - 90) * Math.PI / 180;
            
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
          <div className="relative w-20 h-20 bg-white rounded-full border-4 border-gray-400 flex items-center justify-center shadow-lg z-20">
            <div className="text-3xl">🎁</div>
            {/* Ponteiro vermelho apontando para cima */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[24px] border-l-transparent border-r-transparent border-b-red-600 drop-shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSpin} 
        disabled={isSpinning}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
      >
        {isSpinning ? 'Girando...' : 'Girar a Roda!'}
      </Button>
    </div>
  );
};

export default SpinWheel;
