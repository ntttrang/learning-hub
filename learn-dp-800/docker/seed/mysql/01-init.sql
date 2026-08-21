-- DP-800 cross-database comparison seed for MySQL.
-- Auto-runs on first container start via docker-entrypoint-initdb.d.

CREATE TABLE IF NOT EXISTS product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    attributes JSON NOT NULL,
    color VARCHAR(20) AS (attributes->>'$.color') STORED,
    INDEX idx_color (color)
);

INSERT INTO product (name, price, attributes) VALUES
('Cordless drill', 129.00, '{"color":"blue","voltage":18,"tags":["power","sale"]}'),
('Hex bolt M8', 0.20, '{"color":"silver","thread":"M8","tags":["fastener"]}'),
('LED work light', 49.99, '{"color":"blue","lumens":2000,"tags":["lighting","new"]}'),
('Paint roller', 8.50, '{"color":"yellow","tags":["decor"]}');

-- RLS is emulated via views on MySQL (no native RLS)
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    product VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL
);
INSERT INTO orders (tenant_id, product, amount) VALUES
(1, 'Widget', 10.00), (1, 'Gadget', 25.50),
(2, 'Sprocket', 5.75), (2, 'Cog', 40.00);
