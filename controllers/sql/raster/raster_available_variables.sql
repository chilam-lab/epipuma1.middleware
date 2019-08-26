SELECT 
	fuentes_bioclimaticas.fuente,
	"type"
FROM raster_bins 
	LEFT JOIN fuentes_bioclimaticas 
	ON "type" = fuentes_bioclimaticas.id 
WHERE 
	$<region:raw> = ANY(fuentes_bioclimaticas.footprint_region)
	--1 = ANY(fuentes_bioclimaticas.footprint_region)
GROUP BY 
	"type",
	fuentes_bioclimaticas.fuente
ORDER BY
	"type";