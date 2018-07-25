SELECT 
	fuentes_bioclimaticas.fuente,
	tag,
	layer, 
	label,
	bid,
	"type"
FROM raster_bins
	LEFT JOIN fuentes_bioclimaticas 
	ON "type" = fuentes_bioclimaticas.id 
WHERE 
	raster_bins.layer = $<layername>
	AND $<region> = ANY(fuentes_bioclimaticas.footprint_region)
GROUP BY
	raster_bins.tag,
	fuentes_bioclimaticas.fuente,
	raster_bins.layer, 
	raster_bins.label,
	raster_bins.bid,
	raster_bins."type"
ORDER BY
	raster_bins.layer,
	raster_bins.bid;