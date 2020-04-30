SELECT 
	raster_bins.bid,
	fuentes_bioclimaticas.fuente,
	raster_bins.layer, 
	raster_bins.label, 
	raster_bins.tag,
	raster_bins."type",
	raster_bins.coeficiente,
	raster_bins.unidad,
	raster_bins.description
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