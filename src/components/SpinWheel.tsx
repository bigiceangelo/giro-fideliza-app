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

    // NOVA ABORDAGEM: Primeiro definir onde a roda vai parar, depois determinar o prêmio
    
    // Múltiplas voltas (5-8 voltas) + ângulo final aleatório
    const spins = 5 + Math.random() * 3;
    const totalSpins = spins * 360;
    const finalAngle = Math.random() * 360; // Ângulo final aleatório entre 0-360°
    
    const finalRotation = rotation + totalSpins + finalAngle;
    setRotation(finalRotation);

    // Depois de 4 segundos (quando a animação terminar), calcular qual prêmio ganhou
    setTimeout(() => {
      setIsAnimating(false);
      
      // Calcular qual prêmio está sob o ponteiro agora
      const sectionAngle = 360 / prizes.length;
      
      // O ponteiro está no topo (0°), então precisamos ver qual seção está lá
      // Como a roda girou finalRotation graus, a posição real é:
      const normalizedAngle = finalRotation % 360;
      
      // Converter para encontrar qual seção está no topo
      // Como giramos no sentido horário, invertemos
      const pointerPosition = (360 - normalizedAngle) % 360;
      
      // Determinar qual seção está sob o ponteiro
      const sectionIndex = Math.floor(pointerPosition / sectionAngle) % prizes.length;
      
      console.log('Ângulo final normalizado:', normalizedAngle);
      console.log('Posição do ponteiro:', pointerPosition);
      console.log('Seção sob o ponteiro:', sectionIndex);
      console.log('Prêmio visual:', prizes[sectionIndex].name);
      
      // AGORA vamos aplicar as probabilidades
      // Verificar se o prêmio visual deve ser realmente entregue baseado na probabilidade
      const visualPrize = prizes[sectionIndex];
      
      // Sortear baseado nas probabilidades reais
      const random = Math.random() * 100;
      let accumulator = 0;
      let actualPrize = prizes[0];
      
      for (let i = 0; i < prizes.length; i++) {
        accumulator += prizes[i].percentage;
        if (random <= accumulator) {
          actualPrize = prizes[i];
          break;
        }
      }
      
      console.log('Prêmio sorteado por probabilidade:', actualPrize.name);
      
      // Para demonstração de sincronização, vamos entregar o prêmio visual
      // (em produção real, você escolheria entre visualPrize ou actualPrize)
      onSpin(visualPrize);
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

            // Ângulos da seção (começando do topo, sentido horário)
            const startAngle = index * sectionAngle - 90; // -90 para começar do topo
            const endAngle = (index + 1) * sectionAngle - 90;
            
            // Criar o path SVG para a fatia
            const centerX = 50;
            const centerY = 50;
            const radius = 47;
            
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

            // Calcular posição do texto mais simples
            const textAngle = index * sectionAngle + (sectionAngle / 2); // Sem -90, ângulo direto
            const textAngleRad = (textAngle * Math.PI) / 180;
            const textRadius = 25; // Distância do centro em %
            const textX = 50 + textRadius * Math.cos(textAngleRad - Math.PI/2); // -PI/2 para começar do topo
            const textY = 50 + textRadius * Math.sin(textAngleRad - Math.PI/2);

            return (
              <div key={prize.id} className="absolute inset-0">
                {/* Fatia da roda */}
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
                  <path
                    d={pathData}
                    fill={backgroundColor}
                    stroke="white"
                    strokeWidth="1"
                  />
                </svg>
                
                {/* Texto do prêmio - Posicionamento absoluto simples */}
                <div 
                  className="absolute pointer-events-none z-20 flex items-center justify-center"
                  style={{
                    left: `${textX}%`,
                    top: `${textY}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '60px',
                    height: '40px'
                  }}
                >
                  <div 
                    className="text-white font-bold text-center"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,1)',
                      fontSize: '10px',
                      lineHeight: '1.1',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '3px 6px',
                      borderRadius: '3px',
                      transform: textAngle > 90 && textAngle < 270 ? 'rotate(180deg)' : 'none'
                    }}
                  >
                    <div className="font-bold">
                      {prize.name.length > 8 ? prize.name.substring(0, 8) + '...' : prize.name}
                    </div>
                    <div className="text-xs opacity-90">{prize.percentage}%</div>
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
