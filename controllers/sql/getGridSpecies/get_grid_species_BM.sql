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
			reinovalido,
			phylumdivisionvalido,
			clasevalida,
			ordenvalido,
			familiavalida,
			$<res_celda:raw> as cells 
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
),
counts AS (
	SELECT 	target.spid,
			target.cells,
			target.generovalido,
			target.especievalidabusqueda,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			$<N> as n,
			--14707 as n,
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
			especievalidabusqueda, 
			'' as rango, 
			'' as label 
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
	unnest( $<categorias:raw>
			--animalia||plantae||fungi||protoctista||prokaryotae
			) as spid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-103.271484375 23.017053740980547)',4326))
),

gridsps as ( 
	select 	gridid, 
			grid_spid.spid, 
			especievalidabusqueda as nom_sp, 
			''::text as rango, 
			''::text as label,
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
