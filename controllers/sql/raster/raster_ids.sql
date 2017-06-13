SELECT 
	tag, 
	label, 
	layer, 
	bid, 
	type 
FROM raster_bins 
WHERE layer = $<layername> 
AND type = $<typename>
ORDER BY bid