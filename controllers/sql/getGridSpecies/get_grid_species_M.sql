/*getGridSpecies sin filtros*/
WITH source AS (
	SELECT spid, $<res_celda:raw> as cells 
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
			$<res_celda:raw> as cells,
			1 as tipo
	FROM raster_bins 
	$<where_config_raster:raw>	 
	--where layer = 'bio01'	 
),
counts AS (
	SELECT 	target.spid,
			target.tipo,
			target.cells,
			target.generovalido,
			target.especievalidabusqueda,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			$<N> as n
	FROM source,target
	where 
	target.spid <> $<spid>
	--target.spid <> 33553
	and icount(target.cells) > $<min_occ:raw>
	--and icount(target.cells) > 0
),
rawdata as (
	SELECT 	counts.spid,
			counts.tipo,
			counts.cells,
			--counts.generovalido,
			counts.especievalidabusqueda,
			counts.niyj as nij,
			counts.nj,
			counts.ni,
			counts.n,
			round( cast(  ln(   
				get_score(
					$<alpha>,
					--0.01,
					cast(counts.nj as integer), 
					cast(counts.niyj as integer), 
					cast(counts.ni as integer), 
					cast(counts.n as integer)
					--cast(14707 as integer)
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
),
gridsps as ( 
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
	where 	especievalidabusqueda <> '' 
	order by spid 
),
apriori as (
	select ln( rawdata.ni / ( rawdata.n - rawdata.ni::numeric) ) as val
	from rawdata limit 1
),
celda_score as (
	select 	gridid,
			case when (sum(score) + val) <= -$<maxscore:raw> then 0.00 * 100 
				when (sum(score) + val) >= $<maxscore:raw> then 1.00 * 100 
				else exp(sum(score) + val) / (1 + exp( sum(score) + val ))  * 100 
			end as prob 
	from gridsps, apriori
	group by gridid, val
)
select 	*
from gridsps,
celda_score
order by score desc


/*
grid_spid as (
	SELECT $<res_grid:raw> as gridid,
	unnest( 
			$<categorias:raw>
			) as spid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
),
gridsps as ( 
	select 	gridid, 
			grid_spid.spid, 
			case when tipo = 0
			then especievalidabusqueda
			else ''
			end as nom_sp,
			case when tipo = 1
			then especievalidabusqueda
			else ''
			end as label,
			score
	from rawdata 
	join grid_spid 
	on grid_spid.spid = rawdata.spid  
	where 	especievalidabusqueda <> '' 
			--and rango <> ''  
	order by spid 
),
apriori as (
	select ln( rawdata.ni / ( rawdata.n - rawdata.ni::numeric) ) as val
	from rawdata limit 1
),
celda_score as (
	select 	gridid,
			case when (sum(score) + val) <= -$<maxscore:raw> then 0.00 * 100 
				when (sum(score) + val) >= $<maxscore:raw> then 1.00 * 100 
				else exp(sum(score) + val) / (1 + exp( sum(score) + val ))  * 100 
			end as prob 
	from gridsps, apriori
	group by gridid, val
)
select 	*
from gridsps,
celda_score
order by score desc
*/
