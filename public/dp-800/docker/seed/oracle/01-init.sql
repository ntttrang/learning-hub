-- DP-800 cross-database comparison seed for Oracle Database Free (23ai).
-- Auto-runs on first container start as the APP_USER (dp800).

CREATE TABLE product (
    product_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    price NUMBER(10,2) NOT NULL,
    attributes JSON NOT NULL
);

INSERT INTO product (name, price, attributes) VALUES ('Cordless drill', 129.00, '{"color":"blue","voltage":18,"tags":["power","sale"]}');
INSERT INTO product (name, price, attributes) VALUES ('Hex bolt M8', 0.20, '{"color":"silver","thread":"M8","tags":["fastener"]}');
INSERT INTO product (name, price, attributes) VALUES ('LED work light', 49.99, '{"color":"blue","lumens":2000,"tags":["lighting","new"]}');
INSERT INTO product (name, price, attributes) VALUES ('Paint roller', 8.50, '{"color":"yellow","tags":["decor"]}');

CREATE TABLE orders (
    order_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id NUMBER NOT NULL,
    product VARCHAR2(100) NOT NULL,
    amount NUMBER(10,2) NOT NULL
);
INSERT INTO orders (tenant_id, product, amount) VALUES (1, 'Widget', 10.00);
INSERT INTO orders (tenant_id, product, amount) VALUES (1, 'Gadget', 25.50);
INSERT INTO orders (tenant_id, product, amount) VALUES (2, 'Sprocket', 5.75);
INSERT INTO orders (tenant_id, product, amount) VALUES (2, 'Cog', 40.00);
COMMIT;
