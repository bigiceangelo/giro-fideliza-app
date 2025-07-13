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

    const headers = ['Nome', 'Email', 'Telefone', 'Prêmio', 'Cupom', 'Status do Cupom', 'Data de Participação'];
    const rows = participants.map(p => {
      const nome = extractParticipantValue(p, ['Nome', 'name', 'nome']);
      const email = extractParticipantValue(p, ['Email', 'email']);
      const telefone = extractParticipantValue(p, ['Telefone', 'WhatsApp', 'phone', 'telefone', 'whatsapp']);
      const premio = p.prize_won || p.prize || 'Não girou';
      const cupom = p.coupon_code || p.couponCode || 'N/A';
      const statusCupom = (p.coupon_used || p.couponUsed) ? 'Usado' : 'Não usado';
      const data = new Date(p.timestamp || p.created_at || p.createdAt).toLocaleDateString('pt-BR');
      
      return [nome, email, telefone, premio, cupom, statusCupom, data];
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
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => {
                  console.log(`=== PARTICIPANT ${index} DETAILED DEBUG ===`);
                  console.log('Full participant object:', JSON.stringify(participant, null, 2));
                  
                  const nome = extractParticipantValue(participant, ['Nome', 'name', 'nome']);
                  const email = extractParticipantValue(participant, ['Email', 'email']);
                  const telefone = extractParticipantValue(participant, ['Telefone', 'WhatsApp', 'phone', 'telefone', 'whatsapp']);
                  
                  // CRITICAL FIX: Check for has_spun directly from the database
                  const hasSpun = participant.has_spun === true;
                  console.log('Has spun (direct from DB):', hasSpun);
                  
                  // CRITICAL FIX: Get prize_won directly from the database
                  const premio = participant.prize_won;
                  console.log('Prize won (direct from DB):', premio);
                  
                  // CRITICAL FIX: Get coupon_code directly from the database
                  const cupom = participant.coupon_code;
                  console.log('Coupon code (direct from DB):', cupom);
                  
                  // Status do cupom
                  const cupomUsed = participant.coupon_used === true;
                  console.log('Coupon used (direct from DB):', cupomUsed);
                  
                  console.log('=== FINAL DISPLAY VALUES ===');
                  console.log('Nome:', nome);
                  console.log('Email:', email);
                  console.log('Telefone:', telefone);
                  console.log('Has Spun:', hasSpun);
                  console.log('Prize:', premio);
                  console.log('Coupon:', cupom);
                  console.log('Coupon Used:', cupomUsed);
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{nome}</TableCell>
                      <TableCell>{email}</TableCell>
                      <TableCell>{telefone}</TableCell>
                      <TableCell>
                        {hasSpun ? (
                          premio ? (
                            <Badge variant="default">{premio}</Badge>
                          ) : (
                            <Badge variant="secondary">Girou - sem prêmio</Badge>
                          )
                        ) : (
                          <Badge variant="secondary">Não girou</Badge>
                        )}
                      </TableCell>
                      <TableCell>{cupom || 'N/A'}</TableCell>
                      <TableCell>
                        {cupom ? (
                          <Badge variant={cupomUsed ? "destructive" : "default"}>
                            {cupomUsed ? 'Usado' : 'Não usado'}
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {new Date(participant.timestamp || participant.created_at || participant.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {cupom ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCouponStatus(index)}
                          >
                            {cupomUsed ? (
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
