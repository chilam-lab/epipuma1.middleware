with source AS (
	SELECT  spid,
			reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda,
			1 as grp,
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
raster_cell as (
	SELECT 
		bid as spid,
		layer as reinovalido, label as phylumdivisionvalido, tag as clasevalida, ''::text as  ordenvalido, ''::text as familiavalida, ''::text as generovalido,
		case when type = 1 then
			layer
		else
			case when strpos(label,'Precipit') = 0 then
			(layer || ' ' || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric)/10,2)  ||' ºC - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric)/10,2) || ' ºC')
			else
			(layer || ' ' || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric),2)  ||' mm - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric),2) || ' mm')
			end
		end as especievalidabusqueda,
		2 as grp,
		unnest($<res_celda:raw>) as cell
		--unnest(cells_16km) as cell
	FROM raster_bins
	$<where_config_target_raster:raw>
	--where layer = 'bio1'
),
target AS (
	SELECT spid,
	 		reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda,
	 		2 as grp,
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
			layer as reinovalido, label as phylumdivisionvalido, tag as clasevalida, ''::text as  ordenvalido, ''::text as familiavalida, ''::text as generovalido,
			case when type = 1 then
			layer
			ELSE
			(label || ' ' || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric)/10,2)  ||' ºC - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric)/10,2) || ' ºC')
			--(label || ' ' || tag) 
			end as especievalidabusqueda,
			2 as grp,
			array_intersection($<res_celda:raw>,
				ARRAY(SELECT cells
					FROM grid_geojson_$<resolution:raw>km_aoi
					WHERE footprint_region = $<region:raw>
				)
			) AS cells 
	FROM raster_bins
	--where layer = 'bio01'
	$<where_config_target_raster:raw>
)
select 	spid,
	 	reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, 
	 	especievalidabusqueda  as label,
	 	grp,
	 	icount(cells) as occ
from source 
union 
select 	spid,
	 	reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, 
	 	especievalidabusqueda  as label,
	 	grp,
	 	icount(cells) as occ
from target
where icount(cells) >= $<min_occ:raw>