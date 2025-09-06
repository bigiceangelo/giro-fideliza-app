-- Remove todas as políticas existentes da tabela participations
DROP POLICY IF EXISTS "Enable insert access for anonymous users in active campaigns" ON public.participations;
DROP POLICY IF EXISTS "Enable read access for campaign owners only" ON public.participations;
DROP POLICY IF EXISTS "Enable update access for campaign owners and anonymous users" ON public.participations;

-- Criar política simples para INSERT (permite usuários anônimos em campanhas ativas)
CREATE POLICY "Allow insert in active campaigns" 
ON public.participations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND campaigns.status = 'active'
  )
);

-- Criar política para SELECT (apenas donos das campanhas podem ver)
CREATE POLICY "Campaign owners can view participations" 
ON public.participations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

-- Criar política para UPDATE (donos da campanha ou usuários anônimos podem atualizar)
CREATE POLICY "Allow update for campaign owners and anonymous users" 
ON public.participations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND (
      campaigns.user_id = auth.uid() 
      OR campaigns.status = 'active'
    )
  )
);