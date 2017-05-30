/*getGeoRel sin filtros*/
with source AS (
	SELECT  bid as spid,
			layer as reinovalido, label as phylumdivisionvalido, tag as clasevalida, ''::text as  ordenvalido, ''::text as familiavalida, ''::text as generovalido,
			case when type = 1 then
			layer
			else
			(label || ' ' || tag) 
			end as especievalidabusqueda,
			1 as grp,
			$<res_celda:raw> AS cells
			--raster_bins.cells_16km AS cells
	FROM raster_bins
	--where layer = 'bio01'
	--where bid = 300012
	$<where_config_source_raster:raw>	 
),
target AS (
	SELECT  bid as spid,
			layer as reinovalido, label as phylumdivisionvalido, tag as clasevalida, ''::text as  ordenvalido, ''::text as familiavalida, ''::text as generovalido,
			case when type = 1 then
			layer
			else
			(label || ' ' || tag) 
			end as especievalidabusqueda,
			2 as grp,
			$<res_celda:raw> AS cells
			--raster_bins.cells_16km AS cells 
	FROM raster_bins
	--where bid = 300012
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