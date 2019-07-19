/*getGeoRel sin filtros*/
WITH raster_cell as (
	SELECT 
		case when strpos(label,'Precipit') = 0 then
		(layer || ' ' || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric)/10,2)  ||' ºC - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric)/10,2) || ' ºC')
		else
		(layer || ' ' || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric),2)  ||' mm - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric),2) || ' mm')
		end as especievalidabusqueda,
	bid as spid,
	unnest($<res_celda:raw>) as cell
	--unnest(cells_16km) as cell
	FROM raster_bins
	$<where_config_source_raster:raw>
	--where layer = 'bio1'
), 
source AS (
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
	$<where_config_source_raster:raw>	 	 
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
