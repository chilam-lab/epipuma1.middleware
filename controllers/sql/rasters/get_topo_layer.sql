SELECT 
	tag, 
	label, 
	layer, 
	bid, 
	type 
FROM raster_bins 
WHERE layer = $<layername> 
AND type <> 0
ORDER BY bid