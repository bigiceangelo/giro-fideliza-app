
-- Corrigir a política RLS para permitir inserções anônimas mas manter a segurança na leitura
-- A política atual "Anyone can participate in active campaigns" já permite INSERT para usuários anônimos
-- mas pode estar sendo bloqueada por alguma verificação adicional

-- Vamos verificar e ajustar a política de INSERT para garantir que funcione corretamente
DROP POLICY IF EXISTS "Anyone can participate in active campaigns" ON public.participations;

-- Recriar a política de INSERT com verificação mais específica
CREATE POLICY "Allow anonymous participation in active campaigns" 
ON public.participations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND campaigns.status = 'active'::campaign_status
  )
);

-- Manter a política de UPDATE existente que já permite updates anônimos em campanhas ativas
-- A política "Allow updates for campaign owners and anonymous participants" já está correta

-- Adicionar comentário explicativo
COMMENT ON POLICY "Allow anonymous participation in active campaigns" ON public.participations 
IS 'Permite que usuários anônimos participem de campanhas ativas, mas não podem ler dados de outros participantes';
