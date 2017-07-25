/*getGridSpecies sin filtros*/
with rawdata as (
	select
		-- out_generovalido,
		out_spid as spid,
		out_tipo AS tipo,
		out_cells as cells,
		out_especievalidabusqueda as especievalidabusqueda,
		round(avg(out_nij),2) as nij,
		round(avg(out_nj),2) as nj,
		-- avg(out_ni),
		avg(out_ni)::int as ni,  
	 	avg(out_n)::int as n,
	 	out_reinovalido as reinovalido,
	 	out_phylumdivisionvalido as phylumdivisionvalido,
	 	out_clasevalida as clasevalida,
	 	out_ordenvalido as ordenvalido,
	 	out_familiavalida as familiavalida,
		round(avg(out_epsilon),2) as epsilon,
		round(avg(out_score),2) as score		
	from iteratevalidationprocess($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda:raw>', '$<where_config:value>', '$<where_config_raster:value>', 'both', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, '$<fossil:value>')
	-- from iteratevalidationprocess(1, 28923, 94544, 0.01, 0, array[]::int[], 'gridid_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', true, 1, 2010, 2020, '')
	-- from iteratevalidationprocess(1, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', false, -1, 1500, 2017, '')
	where out_spid is not null
	group by 	out_spid,
				out_tipo,
				out_cells,
				out_especievalidabusqueda,
				out_reinovalido, out_phylumdivisionvalido, out_clasevalida, out_ordenvalido, out_familiavalida
	order by epsilon desc
),
grid_selected as (
	SELECT 
		$<res_grid:raw> as gridid
		--gridid_16km as gridid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
)
select 	gridid, 
		spid,
		especievalidabusqueda as nom_sp,
		label,
		score
from ( 
	select 	gridid, 
			rawdata.spid,
			rawdata.score,
			case when tipo = 0
			then especievalidabusqueda
			else ''
			end as especievalidabusqueda,
			case when tipo = 1
			then especievalidabusqueda
			else ''
			end as label
	from rawdata 
	join grid_selected 
	on intset(grid_selected.gridid) && rawdata.cells
) as total   
order by score desc





/*WITH source AS (
	SELECT spid, 
			--$<res_celda:raw> as cells
			($<res_celda:raw> - array[$<discardedDeleted:raw>]::int[])  as cells 
	FROM sp_snib 
	WHERE 
		spid = $<spid>		
		--spid = 33553
		and especievalidabusqueda <> ''
),
target AS (
	SELECT  generovalido,
			especievalidabusqueda,
			spid,
			reinovalido,
			phylumdivisionvalido,
			clasevalida,
			ordenvalido,
			familiavalida,
			$<res_celda:raw> as cells,
			0 as tipo
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
	union
	SELECT  cast('' as text) generovalido,
			case when type = 1 then
			layer
			else
			(label || ' ' || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric)/10,2)  ||' ºC - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric)/10,2) || ' ºC') 
			end as especievalidabusqueda,
			bid as spid,
			cast('' as text) reinovalido,
			cast('' as text) phylumdivisionvalido,
			cast('' as text) clasevalida,
			cast('' as text) ordenvalido,
			cast('' as text) familiavalida,
			$<res_celda:raw> as cells,
			1 as tipo
	FROM raster_bins 
	$<where_config_raster:raw>	 
	--where layer = 'bio01'	 
),
counts AS (
	SELECT 	target.spid,
			target.cells,
			target.tipo,
			target.generovalido,
			target.especievalidabusqueda,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			$<N> as n,
			target.reinovalido,
			target.phylumdivisionvalido,
			target.clasevalida,
			target.ordenvalido,
			target.familiavalida	
	FROM source,target
	where 
	target.spid <> $<spid>
	--target.spid <> 33553
	and icount(target.cells) > $<min_occ:raw>
	--and icount(target.cells) > 0
),
rawdata as (
	SELECT 	counts.spid,
			counts.cells,
			counts.tipo,
			--counts.generovalido,
			counts.especievalidabusqueda,
			counts.niyj as nij,
			counts.nj,
			counts.ni,
			counts.n,
			counts.reinovalido,
			counts.phylumdivisionvalido,
			counts.clasevalida,
			counts.ordenvalido,
			counts.familiavalida,
			round( cast(  ln(   
				get_score(
					$<alpha>,
					--0.01,
					cast(counts.nj as integer), 
					cast(counts.niyj as integer), 
					cast(counts.ni as integer), 
					cast(counts.n as integer)
				)
			)as numeric), 2) as score
	FROM counts 
),
grid_selected as (
	SELECT 
		$<res_grid:raw> as gridid
		--gridid_16km as gridid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
)
select 	gridid, 
		spid,
		especievalidabusqueda as nom_sp,
		label,
		score
from ( 
	select 	gridid, 
			rawdata.spid,
			rawdata.score,
			case when tipo = 0
			then especievalidabusqueda
			else ''
			end as especievalidabusqueda,
			case when tipo = 1
			then especievalidabusqueda
			else ''
			end as label
	from rawdata 
	join grid_selected 
	on intset(grid_selected.gridid) && rawdata.cells
) as total   
order by score desc
*/

