
-- Adicionar campo para prazo limite de utilização dos prêmios
ALTER TABLE campaigns ADD COLUMN prize_expiry_days INTEGER DEFAULT 30;
