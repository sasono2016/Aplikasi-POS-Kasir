SELECT 
    p.id AS product_id,
    p.sku,
    p.name AS nama_produk,
    c.name AS kategori,
    SUM(sd.qty) AS total_terjual,
    SUM(sd.subtotal) AS total_omset_produk,
    SUM((sd.selling_price - sd.cost_price) * sd.qty) AS total_profit_produk
FROM sale_details sd
JOIN sales s ON sd.sale_id = s.id
JOIN products p ON sd.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE s.transaction_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH) -- Filter 1 bulan terakhir
GROUP BY p.id, p.sku, p.name, c.name
ORDER BY total_terjual DESC
LIMIT 10;