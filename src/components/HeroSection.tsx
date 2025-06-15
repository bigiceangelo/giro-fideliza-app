
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-lime-50 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-brand-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-brand-lime/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-brand-gold/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/80 border border-brand-blue/20 rounded-full mb-8 animate-bounce-in">
            <span className="text-brand-blue font-semibold">🎯 Sistema Completo de Fidelização</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            Transforme Clientes em{' '}
            <span className="text-gradient">Fãs</span>{' '}
            com a Roda da Fortuna
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            Crie campanhas de fidelização gamificadas que envolvem seus clientes e aumentam suas vendas de forma divertida e eficaz.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <Button 
              size="lg" 
              className="bg-brand-blue hover:bg-blue-600 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Começar Grátis
              <ArrowRight className="ml-2" size={20} />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              <Play className="mr-2" size={20} />
              Ver Demo
            </Button>
          </div>

          {/* Spinning Wheel Preview */}
          <div className="relative mx-auto w-64 h-64 md:w-80 md:h-80 animate-bounce-in" style={{animationDelay: '0.6s'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue via-brand-lime to-brand-gold rounded-full animate-spin-wheel" style={{animationDuration: '20s', animationIterationCount: 'infinite'}}>
              {/* Wheel Segments */}
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl mb-2">🎁</div>
                  <div className="text-lg font-bold text-gray-800">Prêmio</div>
                  <div className="text-sm text-gray-600">Especial</div>
                </div>
              </div>
            </div>
            
            {/* Wheel Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-l-transparent border-r-transparent border-b-brand-gold"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
