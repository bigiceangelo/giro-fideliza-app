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

    console.log('Prêmio sorteado:', selectedPrize.name, 'Index:', selectedIndex);

    // Calcular rotação
    const sectionAngle = 360 / prizes.length;
    
    // Múltiplas voltas (5-8 voltas)
    const spins = 5 + Math.random() * 3;
    const totalSpins = spins * 360;
    
    // Para que o prêmio pare no ponteiro (topo), precisamos calcular:
    // O ponteiro está em 0° (topo)
    // Cada prêmio está em sua posição: selectedIndex * sectionAngle
    // Queremos que o CENTRO do prêmio pare no ponteiro
    const prizeCenter = selectedIndex * sectionAngle + (sectionAngle / 2);
    
    // Variação pequena para parecer natural
    const variation = (Math.random() - 0.5) * 10;
    
    // Rotação final: giros + ajuste para parar no prêmio correto
    const finalRotation = rotation + totalSpins + (360 - prizeCenter) + variation;
    
    console.log('Seção do prêmio:', sectionAngle);
    console.log('Centro do prêmio:', prizeCenter);
    console.log('Rotação final:', finalRotation);
    
    setRotation(finalRotation);

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
        {/* Roda */}
        <div 
          ref={wheelRef}
          className="relative w-96 h-96 rounded-full border-8 border-white shadow-2xl bg-white"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: isAnimating ? 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)' : 'none'
          }}
        >
          {prizes.map((prize, index) => {
            // Cores vibrantes
            const colors = [
              '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
              '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
              '#FF8A80', '#80CBC4', '#81C784', '#FFB74D'
            ];
            const backgroundColor = colors[index % colors.length];

            // Ângulos da seção
            const startAngle = index * sectionAngle;
            const endAngle = (index + 1) * sectionAngle;
            
            // Criar o path SVG para a fatia
            const centerX = 192; // metade de 384px
            const centerY = 192;
            const radius = 184; // um pouco menor que 192 para deixar espaço na borda
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
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

            // Posição do texto no meio da seção
            const textAngle = startAngle + sectionAngle / 2;
            const textAngleRad = (textAngle * Math.PI) / 180;
            const textRadius = radius * 0.7; // 70% do raio para posicionar o texto
            const textX = centerX + textRadius * Math.cos(textAngleRad);
            const textY = centerY + textRadius * Math.sin(textAngleRad);

            return (
              <div key={prize.id} className="absolute inset-0">
                {/* Fatia da roda */}
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 384 384">
                  <path
                    d={pathData}
                    fill={backgroundColor}
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
                
                {/* Texto do prêmio */}
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    left: `${textX}px`,
                    top: `${textY}px`,
                    transform: `translate(-50%, -50%) rotate(${textAngle}deg)`,
                    transformOrigin: 'center'
                  }}
                >
                  <div 
                    className="text-white font-bold text-center"
                    style={{ 
                      transform: textAngle > 90 && textAngle < 270 ? 'rotate(180deg)' : 'none',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      fontSize: '14px',
                      lineHeight: '1.2',
                      width: '100px'
                    }}
                  >
                    <div className="text-xs font-bold">
                      {prize.name.length > 12 ? prize.name.substring(0, 12) + '...' : prize.name}
                    </div>
                    <div className="text-xs opacity-90 mt-1">{prize.percentage}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ponteiro e centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Ponteiro apontando para baixo */}
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
