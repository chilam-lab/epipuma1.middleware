SELECT 
	fuentes_bioclimaticas.fuente,
	raster_bins.layer, 
	raster_bins.label,
	raster_bins.type,
	raster_bins.coeficiente,
	raster_bins.unidad,
	raster_bins.description
FROM raster_bins
	LEFT JOIN fuentes_bioclimaticas 
	ON "type" = fuentes_bioclimaticas.id 
WHERE 
	raster_bins.type = $<type>
	--raster_bins.type = 3 and
	AND $<region> = ANY(fuentes_bioclimaticas.footprint_region)
	--1 = ANY(fuentes_bioclimaticas.footprint_region)
GROUP BY
	fuentes_bioclimaticas.fuente,
	raster_bins.layer, 
	raster_bins.label,
	raster_bins.type,
	raster_bins.coeficiente,
	raster_bins.unidad,
	raster_bins.description
ORDER BY
	raster_bins.layer;

