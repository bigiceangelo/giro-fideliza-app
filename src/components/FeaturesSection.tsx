
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Users, BarChart3, Smartphone, Gift, Crown } from 'lucide-react';

const features = [
  {
    icon: Settings,
    title: 'Criação Fácil de Campanhas',
    description: 'Configure sua roda da fortuna em minutos com nossa interface intuitiva. Defina prêmios, cores e mensagens personalizadas.',
    color: 'from-brand-blue to-blue-600'
  },
  {
    icon: Users,
    title: 'Gestão de Participantes',
    description: 'Colete dados dos clientes automaticamente e exporte relatórios completos em CSV para análise detalhada.',
    color: 'from-brand-lime to-green-500'
  },
  {
    icon: BarChart3,
    title: 'Relatórios Detalhados',
    description: 'Acompanhe o desempenho das suas campanhas com métricas em tempo real e insights valiosos.',
    color: 'from-brand-gold to-yellow-500'
  },
  {
    icon: Smartphone,
    title: 'Mobile-First',
    description: 'Experiência otimizada para dispositivos móveis. Seus clientes podem participar facilmente pelo celular.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Gift,
    title: 'Sistema de Cupons',
    description: 'Gere cupons automáticos para os ganhadores. Integre facilmente com seu sistema de vendas.',
    color: 'from-red-500 to-orange-500'
  },
  {
    icon: Crown,
    title: 'Painel Administrativo',
    description: 'Controle total sobre suas campanhas com ferramentas administrativas avançadas e configurações flexíveis.',
    color: 'from-indigo-500 to-blue-600'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Tudo que Você Precisa para{' '}
            <span className="text-gradient">Fidelizar</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Uma plataforma completa com todas as ferramentas necessárias para criar campanhas de fidelização irresistíveis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50"
            >
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
