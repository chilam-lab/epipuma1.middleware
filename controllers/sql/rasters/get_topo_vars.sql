SELECT 
	label, 
	layer, 
	type 
FROM raster_bins
WHERE type <> 0 GROUP BY label, layer, type 
ORDER BY layer