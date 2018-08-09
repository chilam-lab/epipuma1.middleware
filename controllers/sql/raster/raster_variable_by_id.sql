SELECT 
	bid,
	fuentes_bioclimaticas.fuente,
	layer, 
	label, 
	tag,
	"type"
FROM raster_bins 
	LEFT JOIN fuentes_bioclimaticas 
	ON "type" = fuentes_bioclimaticas.id 
WHERE 
	"type" = $<typename>
	AND layer = $<layername>
	AND $<region> = ANY(fuentes_bioclimaticas.footprint_region)
ORDER BY
	bid;