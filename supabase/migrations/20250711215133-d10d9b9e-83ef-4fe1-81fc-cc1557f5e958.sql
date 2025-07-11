
-- Remover a política atual de inserção de participações
DROP POLICY IF EXISTS "Anyone can participate in active campaigns" ON public.participations;

-- Criar nova política mais permissiva para participação anônima
CREATE POLICY "Anyone can participate in active campaigns" ON public.participations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = participations.campaign_id 
      AND campaigns.status = 'active'
    )
  );

-- Adicionar política para permitir que participantes vejam sua própria participação (opcional)
CREATE POLICY "Participants can view their own participation" ON public.participations
  FOR SELECT USING (
    -- Permite que o criador da campanha veja todas as participações
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = participations.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
    -- OU permite acesso anônimo temporário (remover depois se necessário)
    OR auth.uid() IS NULL
  );
