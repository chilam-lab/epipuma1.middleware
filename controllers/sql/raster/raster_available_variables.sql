with arg_gids as (
	select array_agg(gid) as arg_ids 
	FROM aoi
	where fgid = $<region>
	group by fgid
),
footprint as (
	SELECT
		footprint_region
	FROM
		grid_geojson_16km_aoi, arg_gids
	WHERE
		gids @> arg_ids
		-- se descarta opcion de MX y US al mismo tiempo
		and footprint_region <> 3
)
SELECT 
	fuentes_bioclimaticas.fuente,
	-- layer, 
	-- label, 
	"type"
FROM raster_bins 
	LEFT JOIN fuentes_bioclimaticas 
	ON "type" = fuentes_bioclimaticas.id 
, footprint
WHERE 
	footprint.footprint_region = ANY(fuentes_bioclimaticas.footprint_region)
GROUP BY 
	"type",
	fuentes_bioclimaticas.fuente
	-- layer, 
	-- label,
	-- fuentes_bioclimaticas.footprint_region
ORDER BY
	"type";
	--fuentes_bioclimaticas.fuente;