SELECT 
	fuentes_bioclimaticas.fuente,
	layer, 
	label,
	"type"
FROM raster_bins 
	LEFT JOIN fuentes_bioclimaticas 
	ON "type" = fuentes_bioclimaticas.id 
WHERE 
	"type" = $<typename>
GROUP BY
	fuentes_bioclimaticas.fuente,
	layer, 
	label,
	"type"
ORDER BY
	layer;