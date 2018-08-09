SELECT 
	fuentes_bioclimaticas.fuente,
	layer, 
	label
FROM raster_bins
	LEFT JOIN fuentes_bioclimaticas 
	ON "type" = fuentes_bioclimaticas.id 
WHERE 
	raster_bins.type = $<type>
	--raster_bins.type = 1 and
	AND $<region> = ANY(fuentes_bioclimaticas.footprint_region)
	--1 = ANY(fuentes_bioclimaticas.footprint_region)
GROUP BY
	fuentes_bioclimaticas.fuente,
	raster_bins.layer, 
	raster_bins.label
ORDER BY
	raster_bins.layer;