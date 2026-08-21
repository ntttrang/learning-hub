-- DP-800 cross-database comparison seed for PostgreSQL.
-- Auto-runs on first container start via docker-entrypoint-initdb.d.

CREATE TABLE IF NOT EXISTS product (
    product_id serial PRIMARY KEY,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    attributes jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_product_attrs ON product USING GIN (attributes);

INSERT INTO product (name, price, attributes) VALUES
('Cordless drill', 129.00, '{"color":"blue","voltage":18,"tags":["power","sale"]}'),
('Hex bolt M8', 0.20, '{"color":"silver","thread":"M8","tags":["fastener"]}'),
('LED work light', 49.99, '{"color":"blue","lumens":2000,"tags":["lighting","new"]}'),
('Paint roller', 8.50, '{"color":"yellow","tags":["decor"]}');

-- RLS comparison table
CREATE TABLE IF NOT EXISTS orders (
    order_id serial PRIMARY KEY,
    tenant_id int NOT NULL,
    product text NOT NULL,
    amount numeric(10,2) NOT NULL
);
INSERT INTO orders (tenant_id, product, amount) VALUES
(1, 'Widget', 10.00), (1, 'Gadget', 25.50),
(2, 'Sprocket', 5.75), (2, 'Cog', 40.00);

-- Enable pgvector if available (for the vector-search comparison lab)
-- CREATE EXTENSION IF NOT EXISTS vector;
