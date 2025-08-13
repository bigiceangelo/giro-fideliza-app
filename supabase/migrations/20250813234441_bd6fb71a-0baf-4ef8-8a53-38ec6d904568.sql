
-- Remover todas as políticas existentes na tabela participations para recriá-las corretamente
DROP POLICY IF EXISTS "Allow anonymous participation in active campaigns" ON public.participations;
DROP POLICY IF EXISTS "Allow updates for campaign owners and anonymous participants" ON public.participations;
DROP POLICY IF EXISTS "Users can view participations of their own campaigns" ON public.participations;

-- Política para permitir inserção anônima em campanhas ativas (mais permissiva)
CREATE POLICY "Enable insert access for anonymous users in active campaigns" 
ON public.participations 
FOR INSERT 
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND campaigns.status = 'active'::campaign_status
  )
);

-- Política para permitir leitura apenas para donos das campanhas
CREATE POLICY "Enable read access for campaign owners only" 
ON public.participations 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

-- Política para permitir atualizações tanto para donos quanto para usuários anônimos em campanhas ativas
CREATE POLICY "Enable update access for campaign owners and anonymous users" 
ON public.participations 
FOR UPDATE 
TO public
USING (
  -- Permite para donos da campanha (autenticados)
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 
    FROM public.campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND campaigns.user_id = auth.uid()
  ))
  OR
  -- Permite para usuários anônimos em campanhas ativas
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 
    FROM public.campaigns 
    WHERE campaigns.id = participations.campaign_id 
    AND campaigns.status = 'active'::campaign_status
  ))
);
