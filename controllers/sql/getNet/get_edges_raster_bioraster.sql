/*getGeoRel sin filtros*/
with raster_cell as (
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
			array_agg(rc.cell) as cells 
	FROM raster_cell as rc
	--join grid_16km_aoi as gdkm
	join $<res_celda_snib_tb:raw> as gdkm
	--on rc.cell = gdkm.gridid_16km
	on rc.cell = gdkm.$<res_celda_snib:raw>
	join america
	on st_intersects(america.geom, gdkm.small_geom)
	where america.country = 'MEXICO'
	group by spid			 	 
),
raster_cell_target as (
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
	$<where_config_target_raster:raw>
	--where layer = 'bio1'
),
target AS (
	 SELECT  spid,
			$<res_celda:raw> AS cells 
	FROM sp_snib 
	--WHERE generovalido = 'Lutzomyia'
	$<where_config_target:raw>	 
	and especievalidabusqueda <> ''
	union
	SELECT  spid,
			array_agg(rc.cell) as cells 
	FROM raster_cell_target as rc
	--join grid_16km_aoi as gdkm
	join $<res_celda_snib_tb:raw> as gdkm
	--on rc.cell = gdkm.gridid_16km
	on rc.cell = gdkm.$<res_celda_snib:raw>
	join america
	on st_intersects(america.geom, gdkm.small_geom)
	where america.country = 'MEXICO'
	group by spid		  
),
n_res AS (
	SELECT count(*) AS n 
	--FROM grid_16km_aoi as grid_tbl
	FROM $<res_celda_snib_tb:raw> as grid_tbl
	join america 
	on st_intersects(america.geom,grid_tbl.the_geom)
	where america.gid = 19
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
				1/n_res.n,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast(counts.n as integer)
		)as numeric), 2)  as value
FROM counts, n_res
ORDER BY value desc;
