CREATE TABLE IF NOT EXISTS reference_values(
  id BIGSERIAL PRIMARY KEY,
  kind VARCHAR(20) NOT NULL CHECK(kind IN('CATEGORY','BRAND','UNIT')),
  code VARCHAR(40),
  name VARCHAR(120) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reference_kind_name
  ON reference_values(kind, lower(name));

CREATE TABLE IF NOT EXISTS app_settings(
  key VARCHAR(80) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings(key,value) VALUES
  ('company_name','ROVIX CONSTRUMAX'),
  ('company_logo','')
ON CONFLICT(key) DO NOTHING;

INSERT INTO reference_values(kind,code,name) VALUES
 ('UNIT','UN','Unidade'),
 ('UNIT','KG','Quilograma'),
 ('UNIT','M','Metro'),
 ('UNIT','M2','Metro quadrado'),
 ('UNIT','M3','Metro cúbico'),
 ('UNIT','SACO','Saco'),
 ('UNIT','CAIXA','Caixa'),
 ('UNIT','BARRA','Barra'),
 ('UNIT','ROLO','Rolo'),
 ('UNIT','TON','Tonelada'),
 ('CATEGORY','CIMENTOS','Cimentos e argamassas'),
 ('CATEGORY','HIDRAULICA','Hidráulica'),
 ('CATEGORY','ELETRICA','Elétrica'),
 ('CATEGORY','FERRAGENS','Ferragens'),
 ('CATEGORY','TINTAS','Tintas e acessórios'),
 ('CATEGORY','MADEIRAS','Madeiras'),
 ('CATEGORY','PISOS','Pisos e revestimentos')
ON CONFLICT DO NOTHING;
