/*getFreqDecil sin filtros*/
WITH source AS (
	SELECT spid, $<res_celda:raw> as cells 
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
			cast('' as text) reinovalido,
			cast('' as text) phylumdivisionvalido,
			cast('' as text) clasevalida,
			cast('' as text) ordenvalido,
			cast('' as text) familiavalida,
			$<res_celda:raw> as cells 
	FROM raster_bins 
	$<where_config_raster:raw>	
),
counts AS (
	SELECT 	--source.spid as source_spid,
			target.spid,
			target.cells,
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
			counts.especievalidabusqueda as label,
			counts.niyj as nij,
			counts.nj,
			counts.ni,
			counts.n,
			counts.reinovalido,
			counts.phylumdivisionvalido,
			counts.clasevalida,
			counts.ordenvalido,
			counts.familiavalida,
			round( cast(  
			get_epsilon(
				$<alpha>,
				--0.01,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast(counts.n as integer)
			)as numeric), 2)  as epsilon,
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
	ORDER BY epsilon desc
),
basic_score as (
	select 	unnest(cells) as gridid, 
			array_agg(spid|| '|' ||label|| '|' ||epsilon::text|| '|' ||score::text|| '|' ||nj::text) as array_sp,
			sum(score) as tscore
	from rawdata
	group by gridid
	order by tscore desc
),
allgridis as(
	select $<res_grid:raw> as gridid from grid_16km_aoi
),
apriori as (
	select ln( rawdata.ni / ( rawdata.n - rawdata.ni::numeric) ) as val 
	from rawdata limit 1
),
prenorm as (
	select 	allgridis.gridid,
			array_sp,
			COALESCE(tscore+apriori.val, apriori.val) as tscore 
	from basic_score
	right join allgridis
	on basic_score.gridid = allgridis.gridid,
	apriori
	order by tscore desc
),
deciles as ( 
	SELECT gridid, tscore, array_sp, ntile(10) over (order by tscore) AS decil 
	FROM prenorm ORDER BY tscore 
) 
select 
	cast(round( cast(max(tscore) as numeric),2) as float) as l_sup, 
	cast(round( cast(min(tscore) as numeric),2) as float) as l_inf, 
	cast(round( cast(sum(tscore) as numeric),2) as float) as sum, 
	cast(round( cast(avg(tscore) as numeric),2) as float) as avg, 
	decil, array_agg(gridid) as gridids, 
	array_agg(array_to_string(array_sp,',')) as arraynames 
from deciles 
group by decil 
order by decil desc

