
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Eye, Share2, Download, LogOut, Settings, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  [key: string]: any; // Para campos customizados
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
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

  const exportParticipants = (campaignId: string) => {
    const participationsData = localStorage.getItem('fidelizagiro_participations');
    if (participationsData) {
      const allParticipations = JSON.parse(participationsData);
      const campaignParticipants = allParticipations.filter((p: Participant) => p.campaignId === campaignId);
      
      if (campaignParticipants.length === 0) {
        toast({
          title: 'Nenhum participante',
          description: 'Esta campanha ainda não possui participantes',
          variant: 'destructive'
        });
        return;
      }

      // Criar CSV
      const headers = Object.keys(campaignParticipants[0]).join(',');
      const rows = campaignParticipants.map(p => Object.values(p).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participantes-${campaignId}.csv`;
      a.click();
    }
    
    toast({
      title: 'Exportando participantes',
      description: 'O arquivo CSV foi baixado',
    });
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
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={`/campaign/${campaign.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                    </Link>
                    <Link to={`/edit-campaign/${campaign.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setSelectedCampaign(campaign.id);
                            loadParticipants(campaign.id);
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Participantes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Participantes - {campaign.name}</DialogTitle>
                        </DialogHeader>
                        {participants.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">Nenhum participante ainda</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Prêmio</TableHead>
                                <TableHead>Data</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {participants.map((participant, index) => (
                                <TableRow key={index}>
                                  <TableCell>{participant.name || 'N/A'}</TableCell>
                                  <TableCell>{participant.email || 'N/A'}</TableCell>
                                  <TableCell>{participant.phone || 'N/A'}</TableCell>
                                  <TableCell>{participant.prize || 'Não girou'}</TableCell>
                                  <TableCell>{new Date(participant.timestamp).toLocaleDateString('pt-BR')}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportParticipants(campaign.id)}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
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
    </div>
  );
};

export default Dashboard;
