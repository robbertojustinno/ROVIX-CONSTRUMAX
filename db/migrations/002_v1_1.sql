CREATE TABLE IF NOT EXISTS quotations(
 id BIGSERIAL PRIMARY KEY,
 customer_id BIGINT REFERENCES customers(id),
 status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
 subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
 discount NUMERIC(14,2) NOT NULL DEFAULT 0,
 total NUMERIC(14,2) NOT NULL DEFAULT 0,
 valid_until DATE,
 notes TEXT,
 user_id BIGINT REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 converted_sale_id BIGINT REFERENCES sales(id)
);

CREATE TABLE IF NOT EXISTS quotation_items(
 id BIGSERIAL PRIMARY KEY,
 quotation_id BIGINT REFERENCES quotations(id) ON DELETE CASCADE,
 product_id BIGINT REFERENCES products(id),
 warehouse_id BIGINT REFERENCES warehouses(id),
 quantity NUMERIC(14,3) NOT NULL,
 unit_price NUMERIC(14,4) NOT NULL,
 subtotal NUMERIC(14,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_transfers(
 id BIGSERIAL PRIMARY KEY,
 from_warehouse_id BIGINT REFERENCES warehouses(id),
 to_warehouse_id BIGINT REFERENCES warehouses(id),
 status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
 notes TEXT,
 user_id BIGINT REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_transfer_items(
 id BIGSERIAL PRIMARY KEY,
 transfer_id BIGINT REFERENCES stock_transfers(id) ON DELETE CASCADE,
 product_id BIGINT REFERENCES products(id),
 quantity NUMERIC(14,3) NOT NULL
);

ALTER TABLE receivables ADD COLUMN IF NOT EXISTS installment_no INTEGER;
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS installment_count INTEGER;

CREATE INDEX IF NOT EXISTS idx_quotations_created ON quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_created ON stock_transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_receivables_sale ON receivables(sale_id);
