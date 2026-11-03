SELECT 
    DATE_FORMAT(s.transaction_date, '%Y-%m') AS periode_bulan,
    COUNT(DISTINCT s.id) AS total_transaksi,
    SUM(s.grand_total) AS total_omset,
    SUM(sd.cost_price * sd.qty) AS total_hpp,
    SUM(s.grand_total) - SUM(sd.cost_price * sd.qty) AS laba_bersih
FROM sales s
JOIN sale_details sd ON s.id = sd.sale_id
WHERE s.transaction_date >= CURRENT_DATE - INTERVAL 12 MONTH -- 12 bulan terakhir
GROUP BY DATE_FORMAT(s.transaction_date, '%Y-%m')
ORDER BY periode_bulan DESC;