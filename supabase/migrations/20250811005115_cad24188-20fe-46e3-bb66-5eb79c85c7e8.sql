
-- Primeiro, vamos remover a política existente de UPDATE
DROP POLICY IF EXISTS "Users can update participations of their own campaigns" ON public.participations;

-- Criar nova política de UPDATE que permite tanto donos de campanhas quanto participações anônimas
CREATE POLICY "Allow updates for campaign owners and anonymous participants" 
ON public.participations 
FOR UPDATE 
USING (
  -- Permite se for dono da campanha (usuário logado)
  (EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND campaigns.user_id = auth.uid()
  ))
  OR 
  -- OU permite se for participação anônima em campanha ativa
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND campaigns.status = 'active'::campaign_status
  ))
);
