
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-brand-blue via-brand-lime to-brand-gold relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Pronto para Revolucionar
            <br />
            Seu Negócio?
          </h2>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Junte-se a centenas de empresas que já aumentaram suas vendas e fidelizaram mais clientes com o FidelizaGiro
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">+500</div>
              <div className="text-white/80">Campanhas Criadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">+50k</div>
              <div className="text-white/80">Participações</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">98%</div>
              <div className="text-white/80">Satisfação</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white text-brand-blue hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Começar Gratuitamente
              <ArrowRight className="ml-2" size={20} />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-white text-white hover:bg-white hover:text-brand-blue px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 bg-transparent"
            >
              Falar com Especialista
            </Button>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 text-white/70 text-sm">
            ✨ Sem taxa de configuração • Suporte 24/7 • Garantia de 30 dias
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
