SELECT 
    COALESCE(COUNT(DISTINCT s.id), 0) AS total_transaksi_hari_ini,
    COALESCE(SUM(s.grand_total), 0) AS omset_hari_ini,
    COALESCE(SUM((sd.selling_price - sd.cost_price) * sd.qty) - SUM(s.discount), 0) AS laba_bersih_hari_ini
FROM sales s
JOIN sale_details sd ON s.id = sd.sale_id
WHERE DATE(s.transaction_date) = CURRENT_DATE;