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
	--"type" = 3
	"type" = $<typename>
	--AND layer = 'bio055'
	AND layer = $<layername>
	--AND 1 = ANY(fuentes_bioclimaticas.footprint_region)
	AND $<region> = ANY(fuentes_bioclimaticas.footprint_region)
ORDER BY
	bid;