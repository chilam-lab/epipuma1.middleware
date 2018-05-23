SELECT 
	fuentes_bioclimaticas.fuente,
	layer, 
	label, 
	"type", 
	fuentes_bioclimaticas.footprint_region
FROM raster_bins 
	LEFT JOIN fuentes_bioclimaticas 
	ON "type" = fuentes_bioclimaticas.id 
GROUP BY 
	"type", 
	fuentes_bioclimaticas.fuente, 
	layer, 
	label,
	fuentes_bioclimaticas.footprint_region
ORDER BY
	fuentes_bioclimaticas.fuente, layer;