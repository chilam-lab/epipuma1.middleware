SELECT 
	label, 
	layer, 
	type 
FROM raster_bins
join fuentes_bioclimaticas
on id = type
WHERE type = 1 
GROUP BY label, layer, type 
ORDER BY layer