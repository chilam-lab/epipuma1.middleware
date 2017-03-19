/*getGridSpecies sin filtros*/
WITH source AS (
	SELECT spid, cells 
	FROM sp_snib 
	WHERE 
		spid = $<spid>	
		--spid = 33553
		and especievalidabusqueda <> ''
),
target AS (
	SELECT  cast('' as text) generovalido,
			case when type = 1 then
			layer
			else
			(label || ' ' || tag) 
			end as especievalidabusqueda,
			bid as spid,
			cells 
	FROM raster_bins 
	$<where_config_raster:raw>
	--where layer = 'bio01'	 
),
counts AS (
	SELECT 	target.spid,
			target.generovalido,
			target.especievalidabusqueda,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			$<N> as n
			--14707 as n
	FROM source,target
	where 
	target.spid <> $<spid>
	--target.spid <> 33553
	and icount(target.cells) > $<min_occ:raw>
	--and icount(target.cells) > 0
),
rawdata as (
	SELECT 	counts.spid,
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
grid_spid as (
	SELECT gridid,
	unnest( $<categorias:raw>
			--animalia||plantae||fungi||protoctista||prokaryotae
			--bio01||bio02||bio03||bio04||bio05||bio06|| bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19
			--||elevacion || pendiente || topidx
			--||mexca || mexce || mexco || mexk || mexmg || mexmo || mexna || mexph || mexras
			) as spid
	FROM grid_20km_mx 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-103.271484375 23.017053740980547)',4326))
),
gridsps as ( 
	select 	gridid, 
			grid_spid.spid, 
			cast('' as text) as nom_sp, 
			especievalidabusqueda as rango, 
			especievalidabusqueda as label,
			score
	from rawdata 
	join grid_spid 
	on grid_spid.spid = rawdata.spid  
	where especievalidabusqueda <> ''  
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


