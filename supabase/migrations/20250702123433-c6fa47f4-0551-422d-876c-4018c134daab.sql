
-- Criar enum para status das campanhas
CREATE TYPE campaign_status AS ENUM ('active', 'draft');

-- Criar enum para tipos de campos customizados
CREATE TYPE field_type AS ENUM ('text', 'email', 'phone', 'number');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT,
  segment TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de campanhas
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status campaign_status DEFAULT 'draft',
  description TEXT,
  rules TEXT,
  prize_description TEXT,
  collect_data_before BOOLEAN DEFAULT true,
  thank_you_message TEXT DEFAULT 'Obrigado por participar!',
  wheel_color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de prêmios das campanhas
CREATE TABLE public.campaign_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  coupon_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de campos customizados das campanhas
CREATE TABLE public.campaign_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type field_type NOT NULL,
  required BOOLEAN DEFAULT false,
  placeholder TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de participações
CREATE TABLE public.participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  participant_data JSONB NOT NULL,
  has_spun BOOLEAN DEFAULT false,
  prize_won TEXT,
  coupon_code TEXT,
  coupon_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para campaigns
CREATE POLICY "Users can view their own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Política para visualizar campanhas públicas (para participação)
CREATE POLICY "Anyone can view active campaigns for participation" ON public.campaigns
  FOR SELECT USING (status = 'active');

-- Políticas RLS para campaign_prizes
CREATE POLICY "Users can manage prizes of their own campaigns" ON public.campaign_prizes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_prizes.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Política para visualizar prêmios de campanhas ativas
CREATE POLICY "Anyone can view prizes of active campaigns" ON public.campaign_prizes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_prizes.campaign_id 
      AND campaigns.status = 'active'
    )
  );

-- Políticas RLS para campaign_custom_fields
CREATE POLICY "Users can manage custom fields of their own campaigns" ON public.campaign_custom_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_custom_fields.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Política para visualizar campos customizados de campanhas ativas
CREATE POLICY "Anyone can view custom fields of active campaigns" ON public.campaign_custom_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_custom_fields.campaign_id 
      AND campaigns.status = 'active'
    )
  );

-- Políticas RLS para participations
CREATE POLICY "Users can view participations of their own campaigns" ON public.participations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = participations.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update participations of their own campaigns" ON public.participations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = participations.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Política para criar participações em campanhas ativas
CREATE POLICY "Anyone can participate in active campaigns" ON public.participations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = participations.campaign_id 
      AND campaigns.status = 'active'
    )
  );

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
