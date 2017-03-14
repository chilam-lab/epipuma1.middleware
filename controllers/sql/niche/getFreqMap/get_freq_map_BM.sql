/*getMap sin filtros*/
WITH source AS (
	SELECT spid, cells 
	FROM sp_snib 
	WHERE 
		spid = $<spid>
		--spid = 33553		
		and especievalidabusqueda <> ''
),
target AS (
	SELECT  spid,
			cells 
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
),
counts AS (
	SELECT 	target.spid,
			target.cells,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni
	FROM source,target
	where 
	target.spid <> $<spid>
	--target.spid <> 33553
	and icount(target.cells) > $<min_occ:raw>
	--and icount(target.cells) > 0
),
rawdata as (
	SELECT 	counts.cells,
			counts.ni,
			round( cast(  ln(   
					get_score(
						$<alpha>,
						--0.01,
						cast(counts.nj as integer), 
						cast(counts.niyj as integer), 
						cast(counts.ni as integer), 
						cast($<N> as integer)
						--cast(14707 as integer)
					)
				)as numeric), 2) as score
	FROM counts 
),
basic_score as (
	select 	unnest(cells) as gridid, 
		sum(score) as tscore
	from rawdata
	group by gridid
	order by tscore desc
),
allgridis as(
	select gridid from grid_20km_mx
),
apriori as (
	select ln( rawdata.ni / ( $<N> - rawdata.ni::numeric) ) as val
	--select ln( rawdata.ni / ( 14707 - rawdata.ni::numeric) ) as val
	from rawdata limit 1
)
select 	allgridis.gridid, 
		case when tscore <= -$<maxscore>
		--case when tscore <= -700
		then 
			0 
		when tscore >= $<maxscore>
		--when tscore >= 700
		then 
			1 
		else COALESCE( exp(tscore) / (1 + exp(tscore)) , exp(val) / (1 + exp(val)) )  
		end as tscore 
from basic_score
right join allgridis
on basic_score.gridid = allgridis.gridid,
apriori
order by tscore desc
