/*getGeoRel sin filtros*/
with mexico as (
		SELECT
			$<res_celda_snib:raw> AS mex_cells
		FROM $<res_celda_snib_tb:raw> AS a
		JOIN aoi AS b
		ON ST_intersects(a.the_geom, b.geom)
		WHERE b.country = 'MEXICO'
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
		unnest(array_intersection($<res_celda:raw>, ARRAY(SELECT mex_cells FROM mexico)::integer[])) as cell
		--unnest(cells_16km) as cell
	FROM raster_bins
	$<where_config_source_raster:raw>
	--where layer = 'bio1'
),
source AS (
	SELECT  spid,
			reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda, grp,
			array_agg(rc.cell) as cells 
	FROM raster_cell as rc
	--join grid_16km_aoi as gdkm
	join $<res_celda_snib_tb:raw> as gdkm
	--on rc.cell = gdkm.gridid_16km
	on rc.cell = gdkm.$<res_celda_snib:raw>
	group by spid, reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda, grp 
),
raster_cell_target as (
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
		unnest(array_intersection($<res_celda:raw>, ARRAY(SELECT mex_cells FROM mexico)::integer[])) as cell
		--unnest(cells_16km) as cell
	FROM raster_bins
	$<where_config_target_raster:raw>
	--where layer = 'bio1'
),
target AS (
	SELECT spid,
	 		reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda,
	 		2 as grp,
			$<res_celda:raw> AS cells 
	FROM sp_snib 
	--WHERE generovalido = 'Lutzomyia'
	$<where_config_target:raw>	 
	and especievalidabusqueda <> ''
	union
	SELECT  spid,
			reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda, grp,
			array_agg(rc.cell) as cells 
	FROM raster_cell_target as rc
	--join grid_16km_aoi as gdkm
	join $<res_celda_snib_tb:raw> as gdkm
	--on rc.cell = gdkm.gridid_16km
	on rc.cell = gdkm.$<res_celda_snib:raw>
	group by spid, reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda, grp
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