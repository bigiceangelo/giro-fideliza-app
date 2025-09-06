import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

interface Participant {
  campaignId: string;
  timestamp: string;
  hasSpun: boolean;
  prize?: string;
  couponCode?: string;
  couponUsed?: boolean;
  participant_data: any;
  prize_won?: string;
  coupon_code?: string;
  coupon_used?: boolean;
  created_at?: string;
  has_spun?: boolean;
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
    const currentCouponCode = participant.coupon_code || participant.couponCode;
    if (!currentCouponCode) return;
    
    const currentStatus = participant.coupon_used || participant.couponUsed;
    
    onUpdateParticipant(index, {
      couponUsed: !currentStatus,
      coupon_used: !currentStatus
    });
    
    toast({
      title: currentStatus ? 'Cupom marcado como não usado' : 'Cupom marcado como usado',
      description: `Cupom ${currentCouponCode}`,
    });
  };

  const extractParticipantValue = (participant: Participant, fieldNames: string[]) => {
    const data = participant.participant_data || {};
    
    for (const fieldName of fieldNames) {
      if (data[fieldName] && data[fieldName] !== '') return data[fieldName];
      
      const lowerCase = fieldName.toLowerCase();
      if (data[lowerCase] && data[lowerCase] !== '') return data[lowerCase];
      
      const withUnderscore = lowerCase.replace(/\s+/g, '_');
      if (data[withUnderscore] && data[withUnderscore] !== '') return data[withUnderscore];
      
      const noSpaces = fieldName.replace(/\s+/g, '');
      if (data[noSpaces] && data[noSpaces] !== '') return data[noSpaces];
      
      const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase();
      if (data[capitalized] && data[capitalized] !== '') return data[capitalized];
    }
    
    return 'N/A';
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

    const headers = ['Nome', 'Email', 'Telefone', 'Prêmio', 'Cupom', 'Status do Cupom', 'Data/Hora de Participação'];
    const rows = participants.map(p => {
      const nome = extractParticipantValue(p, ['Nome', 'name', 'nome']);
      const email = extractParticipantValue(p, ['Email', 'email']);
      const telefone = extractParticipantValue(p, ['Telefone', 'WhatsApp', 'phone', 'telefone', 'whatsapp']);
      
      const hasSpun = p.has_spun === true;
      const prizeWon = p.prize_won;
      const couponCode = p.coupon_code;
      const couponUsed = p.coupon_used === true;
      
      const premio = hasSpun ? (prizeWon || 'Tente Novamente') : 'Não girou';
      const cupom = couponCode || 'N/A';
      const statusCupom = couponCode ? (couponUsed ? 'Usado' : 'Não usado') : 'N/A';
      
      // Formatar data/hora no horário de São Paulo
      const participationDate = p.timestamp || p.created_at || p.createdAt;
      const dataFormatada = formatInTimeZone(
        new Date(participationDate),
        'America/Sao_Paulo',
        'dd/MM/yyyy HH:mm:ss',
        { locale: ptBR }
      );
      
      return [nome, email, telefone, premio, cupom, statusCupom, dataFormatada];
    });

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
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => {
                  const nome = extractParticipantValue(participant, ['Nome', 'name', 'nome']);
                  const email = extractParticipantValue(participant, ['Email', 'email']);
                  const telefone = extractParticipantValue(participant, ['Telefone', 'WhatsApp', 'phone', 'telefone', 'whatsapp']);
                  
                  const hasSpun = participant.has_spun === true;
                  const prizeWon = participant.prize_won;
                  const couponCode = participant.coupon_code;
                  const couponUsed = participant.coupon_used === true;
                  
                  // Debug logs para investigar o problema
                  console.log('🔍 Debug participante', index, {
                    has_spun: participant.has_spun,
                    hasSpun,
                    prize_won: participant.prize_won,
                    prizeWon,
                    coupon_code: participant.coupon_code,
                    couponCode,
                    participant_data: participant.participant_data,
                    fullParticipant: participant
                  });
                  
                  const participationDate = participant.timestamp || participant.created_at || participant.createdAt;
                  const dataFormatada = formatInTimeZone(
                    new Date(participationDate),
                    'America/Sao_Paulo',
                    'dd/MM/yyyy HH:mm',
                    { locale: ptBR }
                  );
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{nome}</TableCell>
                      <TableCell>{email}</TableCell>
                      <TableCell>{telefone}</TableCell>
                      <TableCell>
                        {(() => {
                          console.log('🎯 Lógica de exibição:', {
                            hasSpun,
                            prizeWon,
                            condition1: hasSpun,
                            condition2: prizeWon && prizeWon !== 'Tente Novamente',
                            willShowPrize: hasSpun && prizeWon && prizeWon !== 'Tente Novamente'
                          });
                          
                          if (hasSpun) {
                            if (prizeWon && prizeWon !== 'Tente Novamente') {
                              return <Badge variant="default">{prizeWon}</Badge>;
                            } else {
                              return <Badge variant="secondary">Tente Novamente</Badge>;
                            }
                          } else {
                            return <Badge variant="secondary">Não girou</Badge>;
                          }
                        })()}
                      </TableCell>
                      <TableCell>{couponCode || 'N/A'}</TableCell>
                      <TableCell>
                        {couponCode ? (
                          <Badge variant={couponUsed ? "destructive" : "default"}>
                            {couponUsed ? 'Usado' : 'Não usado'}
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>{dataFormatada}</TableCell>
                      <TableCell>
                        {couponCode ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCouponStatus(index)}
                          >
                            {couponUsed ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantsModal;
