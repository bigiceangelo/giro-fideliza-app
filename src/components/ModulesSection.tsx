
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Settings, Globe, Database, Shield } from 'lucide-react';

const modules = [
  {
    icon: Users,
    title: 'Módulo 1: Autenticação e Perfil',
    description: 'Sistema completo de cadastro e login com perfil personalizado do usuário',
    features: [
      'Cadastro com dados pessoais e do negócio',
      'Painel personalizado do usuário',
      'Gestão de campanhas criadas',
      'Exportação de participantes'
    ],
    status: 'Essencial'
  },
  {
    icon: Settings,
    title: 'Módulo 2: Criação de Campanha',
    description: 'Ferramentas avançadas para criar e personalizar campanhas de fidelização',
    features: [
      'Configuração de prêmios e probabilidades',
      'Personalização visual da roda',
      'Sistema de cupons integrado',
      'Mensagens personalizadas'
    ],
    status: 'Principal'
  },
  {
    icon: Globe,
    title: 'Módulo 3: Página Pública',
    description: 'Interface otimizada para participação dos clientes via QR Code ou link',
    features: [
      'Roda da fortuna animada e responsiva',
      'Formulários inteligentes',
      'Compartilhamento automático',
      'Experiência mobile-first'
    ],
    status: 'Interativo'
  },
  {
    icon: Database,
    title: 'Módulo 4: Banco de Dados',
    description: 'Estrutura robusta de dados para armazenar informações de forma segura',
    features: [
      'Gestão de usuários e campanhas',
      'Histórico de participações',
      'Relatórios detalhados',
      'Backup automático'
    ],
    status: 'Seguro'
  },
  {
    icon: Shield,
    title: 'Módulo 5: Super Admin',
    description: 'Painel administrativo completo para gerenciar toda a plataforma',
    features: [
      'Controle de funcionalidades',
      'Gestão de usuários',
      'Estatísticas avançadas',
      'Logs de segurança'
    ],
    status: 'Avançado'
  }
];

const ModulesSection = () => {
  return (
    <section className="py-20 bg-gradient-brand-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            5 Módulos <span className="text-gradient">Completos</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sistema modular desenvolvido para atender todas as necessidades do seu negócio, desde a criação até a gestão avançada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {modules.map((module, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white border-0 overflow-hidden"
            >
              <CardHeader className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-lime flex items-center justify-center">
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {module.title}
                    </CardTitle>
                    <span className="inline-block px-3 py-1 bg-brand-gold/20 text-brand-gold text-xs font-semibold rounded-full mt-1">
                      {module.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {module.description}
                </p>
                
                <div className="space-y-3">
                  {module.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-6 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-300"
                >
                  Saiba Mais
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
