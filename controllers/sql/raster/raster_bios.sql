-- SELECT 
-- 	label, 
-- 	layer, 
-- 	type 
-- FROM raster_bins
-- WHERE type = 0 
-- GROUP BY label, layer, type 
-- ORDER BY layer
SELECT rb.layer, rbf.label, rbf."type"
FROM raster_bins as rb
join raster_bins_future rbf
on rb.bid = rbf.bid
where rbf.type = 0
GROUP BY rbf.label, rb.layer, rbf.type 
ORDER BY rb.layer;