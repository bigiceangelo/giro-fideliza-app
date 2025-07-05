
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Participant {
  campaignId: string;
  timestamp: string;
  hasSpun: boolean;
  prize?: string;
  couponCode?: string;
  couponUsed?: boolean;
  participant_data: any; // Dados do formulário de participação
  [key: string]: any;
}

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  campaignId: string;
  participants: Participant[];
  onUpdateParticipant: (index: number, updates: Partial<Participant>) => void;
}

const ParticipantsModal = ({ 
  isOpen, 
  onClose, 
  campaignName, 
  campaignId, 
  participants, 
  onUpdateParticipant 
}: ParticipantsModalProps) => {
  const { toast } = useToast();

  const toggleCouponStatus = (index: number) => {
    const participant = participants[index];
    if (!participant.couponCode) return;
    
    onUpdateParticipant(index, {
      couponUsed: !participant.couponUsed
    });
    
    toast({
      title: participant.couponUsed ? 'Cupom marcado como não usado' : 'Cupom marcado como usado',
      description: `Cupom ${participant.couponCode}`,
    });
  };

  const exportToExcel = () => {
    if (participants.length === 0) {
      toast({
        title: 'Nenhum participante',
        description: 'Esta campanha ainda não possui participantes',
        variant: 'destructive'
      });
      return;
    }

    // Criar dados para Excel com todos os campos disponíveis
    const headers = ['Nome', 'Email', 'Telefone', 'Prêmio', 'Cupom', 'Status do Cupom', 'Data de Participação'];
    const rows = participants.map(p => [
      p.participant_data?.name || p.participant_data?.nome || 'N/A',
      p.participant_data?.email || 'N/A', 
      p.participant_data?.phone || p.participant_data?.telefone || 'N/A',
      p.prize_won || p.prize || 'Não girou',
      p.coupon_code || p.couponCode || 'N/A',
      p.coupon_used || p.couponUsed ? 'Usado' : 'Não usado',
      new Date(p.timestamp || p.created_at).toLocaleDateString('pt-BR')
    ]);

    // Criar CSV (Excel pode abrir CSV)
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes-${campaignName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({
      title: 'Arquivo exportado',
      description: 'Os dados dos participantes foram baixados em formato CSV',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Participantes - {campaignName}</DialogTitle>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {participants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum participante ainda</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead>Cupom</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {participant.participant_data?.name || participant.participant_data?.nome || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {participant.participant_data?.email || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {participant.participant_data?.phone || participant.participant_data?.telefone || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {participant.prize_won || participant.prize ? (
                        <Badge variant="default">{participant.prize_won || participant.prize}</Badge>
                      ) : (
                        <Badge variant="secondary">Não girou</Badge>
                      )}
                    </TableCell>
                    <TableCell>{participant.coupon_code || participant.couponCode || 'N/A'}</TableCell>
                    <TableCell>
                      {(participant.coupon_code || participant.couponCode) && (
                        <Badge variant={(participant.coupon_used || participant.couponUsed) ? "destructive" : "default"}>
                          {(participant.coupon_used || participant.couponUsed) ? 'Usado' : 'Não usado'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(participant.timestamp || participant.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {(participant.coupon_code || participant.couponCode) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCouponStatus(index)}
                        >
                          {(participant.coupon_used || participant.couponUsed) ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantsModal;
