INSERT INTO admin_users (username, password_hash, full_name, email, role, is_active) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', 'admin@vicmic.id', 'super_admin', 1);

INSERT INTO categories (slug, name, parent_id) VALUES
('laptop', 'Laptop', NULL),
('desktop-pc', 'Desktop PC', NULL),
('monitor', 'Monitor', NULL),
('aksesoris', 'Aksesoris', NULL),
('laptop-gaming', 'Laptop Gaming', 1),
('laptop-bisnis', 'Laptop Bisnis', 1);

INSERT INTO brands (slug, name) VALUES
('asus', 'ASUS'),
('acer', 'Acer'),
('hp', 'HP'),
('lenovo', 'Lenovo'),
('msi', 'MSI'),
('apple', 'Apple');

INSERT INTO warehouses (code, name, address, city_id, province_id, postal_code, is_active) VALUES
('WH-JKT', 'Gudang Pusat Jakarta', 'Mangga Dua Raya', 152, 6, '10730', 1),
('WH-SBY', 'Gudang Cabang Surabaya', 'Jl. Pemuda', 444, 11, '60271', 1);

INSERT INTO products (slug, name, sku, category_id, brand_id, base_price, sale_price, stock, status) VALUES
('asus-rog-strix-g15', 'ASUS ROG Strix G15 (2026)', 'ASUS-ROG-G15-01', 5, 1, 24500000, 23999000, 10, 'active'),
('lenovo-legion-5-pro', 'Lenovo Legion 5 Pro', 'LEN-LEG-5P-01', 5, 4, 26000000, 25500000, 5, 'active');

INSERT INTO product_stocks (product_id, warehouse_id, quantity, reserved_quantity) VALUES
(1, 1, 7, 0),
(1, 2, 3, 0),
(2, 1, 5, 0);
