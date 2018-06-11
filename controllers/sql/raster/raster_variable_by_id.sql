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
	and layer = $<layername>
ORDER BY
	bid;