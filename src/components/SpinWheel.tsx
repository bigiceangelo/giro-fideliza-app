
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
    const targetAngle = (selectedIndex * sectionAngle) + (sectionAngle / 2);
    const spinAmount = 360 * 5; // 5 voltas completas
    const finalRotation = rotation + spinAmount + (360 - targetAngle);

    setRotation(finalRotation);

    // Chamar callback após a animação
    setTimeout(() => {
      onSpin(selectedPrize);
    }, 3000);
  };

  const sectionAngle = 360 / prizes.length;

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-80 h-80">
        {/* Ponteiro */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-l-transparent border-r-transparent border-b-yellow-500 drop-shadow-lg"></div>
        </div>

        {/* Roda */}
        <div 
          ref={wheelRef}
          className={`relative w-80 h-80 rounded-full border-8 border-gray-300 shadow-2xl transition-transform duration-3000 ease-out`}
          style={{ 
            transform: `rotate(${rotation}deg)`,
            background: 'white'
          }}
        >
          {prizes.map((prize, index) => {
            const startAngle = index * sectionAngle;
            const endAngle = (index + 1) * sectionAngle;
            
            // Cores alternadas para melhor visibilidade
            const colors = [
              '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
              '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
            ];
            const backgroundColor = colors[index % colors.length];

            return (
              <div
                key={prize.id}
                className="absolute w-full h-full"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((endAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((endAngle - 90) * Math.PI / 180)}%)`,
                  backgroundColor
                }}
              >
                <div 
                  className="absolute text-center font-bold text-white text-sm leading-tight"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${startAngle + sectionAngle / 2}deg) translateY(-80px)`,
                    width: '120px'
                  }}
                >
                  <div 
                    style={{ 
                      transform: `rotate(${-(startAngle + sectionAngle / 2)}deg)`,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                    }}
                  >
                    {prize.name.length > 15 ? prize.name.substring(0, 15) + '...' : prize.name}
                    <div className="text-xs mt-1">{prize.percentage}%</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Centro da roda */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full border-4 border-gray-400 flex items-center justify-center shadow-lg">
              <div className="text-2xl">🎁</div>
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
