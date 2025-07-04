
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Share2, LogOut, Settings, Edit, Trash2, Users, Cog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ParticipantsModal from '@/components/ParticipantsModal';
import WheelSimulationModal from '@/components/WheelSimulationModal';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'draft';
  created_at: string;
  description?: string;
  rules?: string;
  prize_description?: string;
  collect_data_before: boolean;
  thank_you_message: string;
  wheel_color: string;
  participants_count?: number;
  prizes?: any[];
}

// Interface compatível com ParticipantsModal
interface Participant {
  id: string;
  campaignId: string;
  participant_data: any;
  hasSpun: boolean;
  prize_won?: string;
  coupon_code?: string;
  coupon_used: boolean;
  timestamp: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCampaigns();
  }, [user, navigate]);

  const loadCampaigns = async () => {
    try {
      const { data: campaignsData, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_prizes(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Carregar contagem de participantes para cada campanha
      const campaignsWithCounts = await Promise.all(
        campaignsData.map(async (campaign) => {
          const { count } = await supabase
            .from('participations')
            .select('*', { count: 'exact' })
            .eq('campaign_id', campaign.id);

          return {
            ...campaign,
            participants_count: count || 0,
            prizes: campaign.campaign_prizes || [],
          };
        })
      );

      setCampaigns(campaignsWithCounts);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar campanhas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('participations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transformar os dados do Supabase para o formato esperado pelo ParticipantsModal
      const transformedParticipants: Participant[] = (data || []).map(participation => ({
        id: participation.id,
        campaignId: participation.campaign_id,
        participant_data: participation.participant_data,
        hasSpun: participation.has_spun || false,
        prize_won: participation.prize_won,
        coupon_code: participation.coupon_code,
        coupon_used: participation.coupon_used || false,
        timestamp: participation.created_at || ''
      }));
      
      setParticipants(transformedParticipants);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar participantes',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateParticipant = async (participantId: string, updates: Partial<Participant>) => {
    try {
      // Transformar as atualizações para o formato do Supabase
      const supabaseUpdates: Record<string, any> = {};
      
      if (updates.hasSpun !== undefined) supabaseUpdates.has_spun = updates.hasSpun;
      if (updates.prize_won !== undefined) supabaseUpdates.prize_won = updates.prize_won;
      if (updates.coupon_code !== undefined) supabaseUpdates.coupon_code = updates.coupon_code;
      if (updates.coupon_used !== undefined) supabaseUpdates.coupon_used = updates.coupon_used;

      const { error } = await supabase
        .from('participations')
        .update(supabaseUpdates)
        .eq('id', participantId);

      if (error) throw error;

      setParticipants(prev => 
        prev.map(p => p.id === participantId ? { ...p, ...updates } : p)
      );

      toast({
        title: 'Participante atualizado',
        description: 'Status do cupom foi alterado',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar participante',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro no logout',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      
      toast({
        title: 'Campanha deletada',
        description: 'A campanha foi removida com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar campanha',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const shareCampaign = (campaignId: string) => {
    const campaignUrl = `${window.location.origin}/campaign/${campaignId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Participe da nossa promoção!',
        text: 'Gire a roda da fortuna e ganhe prêmios incríveis!',
        url: campaignUrl
      }).catch(() => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-blue"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const totalParticipants = campaigns.reduce((acc, campaign) => acc + (campaign.participants_count || 0), 0);
  const totalPrizes = campaigns.reduce((acc, campaign) => acc + (campaign.prizes?.length || 0), 0);

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
                <span className="text-gray-600">Olá, {user?.user_metadata?.name || user?.email}!</span>
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
              <div className="text-2xl font-bold">{totalParticipants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prêmios Distribuídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPrizes}</div>
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
                    {campaign.participants_count || 0} participantes • {campaign.prizes?.length || 0} prêmios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      Criada em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </span>
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
            onUpdateParticipant={(index: number, updates: Partial<Participation>) => {
              const participant = participants[index];
              if (participant) {
                updateParticipant(participant.id, updates);
              }
            }}
          />
          
          <WheelSimulationModal
            isOpen={showWheelModal}
            onClose={() => setShowWheelModal(false)}
            campaignName={selectedCampaign.name}
            prizes={selectedCampaign.prizes || []}
            wheelColor={selectedCampaign.wheel_color || '#3B82F6'}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
