-- SELECT 
-- 	tag, 
-- 	label, 
-- 	layer, 
-- 	bid, 
-- 	type 
-- FROM raster_bins 
-- WHERE layer = $<layername> 
-- AND type = $<typename>
-- ORDER BY bid
SELECT 
	rb.tag, 
	rbf.label, 
	rb.layer, 
	rb.bid, 
	rbf.type 
FROM raster_bins as rb
join raster_bins_future rbf
on rb.bid = rbf.bid
WHERE rb.layer = $<layername> 
AND rbf.type = $<typename>
ORDER BY rb.bid