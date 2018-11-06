with source AS (
	SELECT  spid,
			array_intersection($<res_celda:raw>,
				ARRAY(SELECT cells
					FROM grid_geojson_$<resolution:raw>km_aoi
					WHERE footprint_region = $<region:raw>
				)
			) AS cells 
	FROM sp_snib 
	--WHERE generovalido = 'Aedes'
	$<where_config_source:raw>	 
	and especievalidabusqueda <> ''	 	 
),
target AS (
	 SELECT spid,
			array_intersection($<res_celda:raw>,
				ARRAY(SELECT cells
					FROM grid_geojson_$<resolution:raw>km_aoi
					WHERE footprint_region = $<region:raw>
				)
			) AS cells 
	FROM sp_snib 
	--WHERE generovalido = 'Lutzomyia'
	$<where_config_target:raw>	 
	and especievalidabusqueda <> ''
	union
	SELECT  bid as spid,
			array_intersection($<res_celda:raw>,
				ARRAY(SELECT cells
					FROM grid_geojson_$<resolution:raw>km_aoi
					WHERE footprint_region = $<region:raw>
				)
			) AS cells 
	FROM raster_bins
	--where layer = 'bio01'
	$<where_config_target_raster:raw>	  
),
n_res AS (
	SELECT array_length(cells, 1) AS n
	FROM grid_geojson_$<resolution:raw>km_aoi
	WHERE footprint_region = $<region:raw>
),
counts AS (
	SELECT 	source.spid as source,
			target.spid as target,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			n_res.n AS n
	FROM source, target, n_res
	--where icount(source.cells & target.cells) > 0
	where icount(target.cells) > $<min_occ:raw>
	and icount(source.cells) > 0
) 
SELECT 	counts.source,
		counts.target,
		counts.niyj as nij,
		counts.nj,
		counts.ni,
		counts.n,
		round( cast(  
			get_epsilon(
				--$<alpha>,
				1.0/n_res.n,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast(counts.n as integer)
		)as numeric), 2)  as value,
		round( cast( ln(   
			get_score(
				1.0/n_res.n,
				cast( counts.nj as integer),
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast(counts.n as integer)
			)
		) as numeric), 2) as score
FROM counts, n_res
ORDER BY value desc;
