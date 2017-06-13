/*getGridSpecies sin filtros*/
WITH source AS (
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


/*
grid_spid as (
	SELECT $<res_grid:raw> as gridid,
	unnest( 
			-- NOTA DINAMICO: verificar cuando se envian las variables depediendo de los filtros rastersleccionados!!!!
			--animalia||plantae||fungi||protoctista||prokaryotae||
			--bio01||bio02||bio03||bio04||bio05||bio06|| bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19
			$<categorias:raw>
			) as spid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
	-- -96.339111328125 19.427484900299145	| score total: -0.72 | celda:588870   
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
),
gridsps as ( 
	select 	gridid, 
			spid,
			especievalidabusqueda as nom_sp,
			label
	from ( 
		select 	gridid, 
				grid_spid.spid, 
				case when tipo = 0
				then especievalidabusqueda
				else ''
				end as especievalidabusqueda,
				case when tipo = 1
				then especievalidabusqueda
				else ''
				end as label
		from rawdata 
		join grid_spid 
		on grid_spid.spid = rawdata.spid
	--) 
	) as total 
	--where 	especievalidabusqueda <> ''  
	order by spid 
)
select gridsps.*,  score 
from gridsps  
join rawdata 
on gridsps.spid = rawdata.spid 
order by score desc
*/
