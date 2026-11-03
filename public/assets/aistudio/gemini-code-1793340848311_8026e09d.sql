SELECT 
    DATE(s.transaction_date) AS tanggal,
    COUNT(DISTINCT s.id) AS total_transaksi,
    SUM(s.grand_total) AS total_omset,
    SUM(sd.cost_price * sd.qty) AS total_hpp,
    SUM(s.grand_total) - SUM(sd.cost_price * sd.qty) AS laba_bersih
FROM sales s
JOIN sale_details sd ON s.id = sd.sale_id
WHERE s.transaction_date >= CURRENT_DATE - INTERVAL 30 DAY -- 30 hari terakhir
GROUP BY DATE(s.transaction_date)
ORDER BY tanggal DESC;