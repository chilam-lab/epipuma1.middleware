SELECT
	fuentes_bioclimaticas.fuente,
	layer, 
	label, 
	"type"
FROM raster_bins 
	LEFT JOIN fuentes_bioclimaticas 
	ON "type" = fuentes_bioclimaticas.id 
WHERE 
	$<region:raw> = ANY(fuentes_bioclimaticas.footprint_region)
GROUP BY 
	"type",
	fuentes_bioclimaticas.fuente,
	layer, 
	label,
	fuentes_bioclimaticas.footprint_region
ORDER BY
	layer,
	"type",
	fuentes_bioclimaticas.fuente;