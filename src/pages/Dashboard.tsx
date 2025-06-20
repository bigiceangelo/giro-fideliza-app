import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Share2, LogOut, Settings, Edit, Trash2, Users, Cog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ParticipantsModal from '@/components/ParticipantsModal';
import WheelSimulationModal from '@/components/WheelSimulationModal';

interface Campaign {
  id: string;
  name: string;
  prizes: number;
  participants: number;
  status: 'active' | 'draft';
  createdAt: string;
  config?: {
    prizes: any[];
    collectDataBefore: boolean;
    thankYouMessage: string;
    wheelColor: string;
    customFields: CustomField[];
    description?: string;
    rules?: string;
    prizeDescription?: string;
  };
}

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'number';
  required: boolean;
  placeholder: string;
}

interface Participant {
  campaignId: string;
  timestamp: string;
  hasSpun: boolean;
  prize?: string;
  couponCode?: string;
  couponUsed?: boolean;
  [key: string]: any; // Para campos customizados
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('fidelizagiro_user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));

    loadCampaigns();
  }, [navigate]);

  const loadCampaigns = () => {
    const savedCampaigns = localStorage.getItem('fidelizagiro_campaigns');
    if (savedCampaigns) {
      const campaignsData = JSON.parse(savedCampaigns);
      
      // Debug: Log das campanhas carregadas
      console.log('Campanhas carregadas:', campaignsData);
      
      // Calcular participantes para cada campanha
      const participationsData = localStorage.getItem('fidelizagiro_participations');
      const participations = participationsData ? JSON.parse(participationsData) : [];
      
      const updatedCampaigns = campaignsData.map((campaign: Campaign) => ({
        ...campaign,
        participants: participations.filter((p: Participant) => p.campaignId === campaign.id).length
      }));
      
      setCampaigns(updatedCampaigns);
    }
  };

  const loadParticipants = (campaignId: string) => {
    const participationsData = localStorage.getItem('fidelizagiro_participations');
    if (participationsData) {
      const allParticipations = JSON.parse(participationsData);
      const campaignParticipants = allParticipations.filter((p: Participant) => p.campaignId === campaignId);
      setParticipants(campaignParticipants);
    }
  };

  const updateParticipant = (index: number, updates: Partial<Participant>) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index] = { ...updatedParticipants[index], ...updates };
    setParticipants(updatedParticipants);

    // Atualizar no localStorage
    const participationsData = localStorage.getItem('fidelizagiro_participations');
    if (participationsData) {
      const allParticipations = JSON.parse(participationsData);
      const participantToUpdate = updatedParticipants[index];
      
      const globalIndex = allParticipations.findIndex((p: Participant) => 
        p.campaignId === participantToUpdate.campaignId && 
        p.timestamp === participantToUpdate.timestamp
      );
      
      if (globalIndex >= 0) {
        allParticipations[globalIndex] = participantToUpdate;
        localStorage.setItem('fidelizagiro_participations', JSON.stringify(allParticipations));
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fidelizagiro_user');
    localStorage.removeItem('fidelizagiro_campaigns');
    toast({
      title: 'Logout realizado',
      description: 'Até logo!',
    });
    navigate('/');
  };

  const deleteCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
    localStorage.setItem('fidelizagiro_campaigns', JSON.stringify(updatedCampaigns));
    setCampaigns(updatedCampaigns);
    
    toast({
      title: 'Campanha deletada',
      description: 'A campanha foi removida com sucesso',
    });
  };

  const shareCampaign = (campaignId: string) => {
    // Debug: Verificar se a campanha existe
    console.log('Tentando compartilhar campanha ID:', campaignId);
    console.log('Campanhas disponíveis:', campaigns.map(c => ({ id: c.id, name: c.name })));
    
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      console.error('Campanha não encontrada para compartilhamento:', campaignId);
      toast({
        title: 'Erro',
        description: 'Campanha não encontrada',
        variant: 'destructive'
      });
      return;
    }
    
    const campaignUrl = `${window.location.origin}/campaign/${campaignId}`;
    console.log('URL da campanha:', campaignUrl);
    
    if (navigator.share) {
      navigator.share({
        title: `Participe da nossa promoção: ${campaign.name}`,
        text: 'Gire a roda da fortuna e ganhe prêmios incríveis!',
        url: campaignUrl
      }).catch((error) => {
        console.log('Erro no share nativo, copiando para clipboard:', error);
        // Se o share nativo falhar, copia para clipboard
        navigator.clipboard.writeText(campaignUrl);
        toast({
          title: 'Link copiado!',
          description: 'O link da campanha foi copiado para a área de transferência',
        });
      });
    } else {
      navigator.clipboard.writeText(campaignUrl);
      toast({
        title: 'Link copiado!',
        description: 'O link da campanha foi copiado para a área de transferência',
      });
    }
  };

  const openWheelSimulation = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowWheelModal(true);
  };

  const openParticipantsModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    loadParticipants(campaign.id);
    setShowParticipantsModal(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-lime rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-brand-gold rounded-full"></div>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-gradient">FidelizaGiro</h1>
              </div>
              <div className="hidden md:block">
                <span className="text-gray-600">Olá, {user.name}!</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns.reduce((acc, campaign) => acc + campaign.participants, 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prêmios Distribuídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns.reduce((acc, campaign) => acc + campaign.prizes, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Suas Campanhas</h2>
          <Link to="/create-campaign">
            <Button className="bg-brand-blue hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma campanha criada</h3>
                <p className="text-gray-600 mb-6">Crie sua primeira campanha de fidelização</p>
                <Link to="/create-campaign">
                  <Button className="bg-brand-blue hover:bg-blue-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Campanha
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status === 'active' ? 'Ativa' : 'Rascunho'}
                    </Badge>
                  </div>
                  <CardDescription>
                    {campaign.participants} participantes • {campaign.prizes} prêmios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {/* Debug: Mostrar ID da campanha */}
                  <div className="text-xs text-gray-400 mb-2">
                    ID: {campaign.id}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openWheelSimulation(campaign)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Link to={`/edit-campaign/${campaign.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openParticipantsModal(campaign)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Participantes
                    </Button>
                    <Link to={`/campaign-config/${campaign.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Cog className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => shareCampaign(campaign.id)}
                      className="w-full"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteCampaign(campaign.id)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCampaign && (
        <>
          <ParticipantsModal
            isOpen={showParticipantsModal}
            onClose={() => setShowParticipantsModal(false)}
            campaignName={selectedCampaign.name}
            campaignId={selectedCampaign.id}
            participants={participants}
            onUpdateParticipant={updateParticipant}
          />
          
          <WheelSimulationModal
            isOpen={showWheelModal}
            onClose={() => setShowWheelModal(false)}
            campaignName={selectedCampaign.name}
            prizes={selectedCampaign.config?.prizes || []}
            wheelColor={selectedCampaign.config?.wheelColor || '#3B82F6'}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
