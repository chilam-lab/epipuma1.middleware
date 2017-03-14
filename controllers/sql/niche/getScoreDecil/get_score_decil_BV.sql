/*getFreqDecil sin filtros*/
WITH source AS (
	SELECT spid, cells 
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
			cells 
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
),
filter_ni AS (
		SELECT 	spid, 
				icount( cells - array[$<arg_gridids:raw>] ) as ni,
				--icount( cells - array[573324, 581126, 507259] ) as ni,
				cells - array[$<arg_gridids:raw> ]  as cells
				--cells - array[573324, 581126, 507259 ]  as cells
		FROM source 
), 
filter_nj AS(
		select 	generovalido,
				especievalidabusqueda,
				spid,
				reinovalido,
				phylumdivisionvalido,
				clasevalida,
				ordenvalido,
				familiavalida,
				icount(cells - array[$<arg_gridids:raw>]) AS nj,
				--icount(cells - array[573324, 581126, 507259]) AS nj,
				cells - array[ $<arg_gridids:raw> ]  AS cells
				--cells - array[573324, 581126, 507259 ]  AS cells
		FROM target 
),
/*filter_nij AS(
		select 	filter_nj.spid, 
				icount(filter_ni.cells & filter_nj.cells) AS niyj
				--icount(source.cells & target.cells & array[573324, 581126, 507259 ]) AS d_niyj
		FROM filter_ni, filter_nj
),*/
counts AS (
	SELECT 	--source.spid as source_spid,
			filter_nj.spid,
			filter_nj.cells,
			filter_nj.generovalido,
			filter_nj.especievalidabusqueda,
			icount(filter_ni.cells & filter_nj.cells) AS niyj,
			filter_nj.nj,
			filter_ni.ni,
			filter_nj.reinovalido,
			filter_nj.phylumdivisionvalido,
			filter_nj.clasevalida,
			filter_nj.ordenvalido,
			filter_nj.familiavalida
	FROM filter_ni, filter_nj
	where 
	filter_nj.spid <> $<spid>
	--filter_nj.spid <> 33553
	and icount(filter_nj.cells) > $<min_occ:raw>
	--and icount(filter_nj.cells) > 0
),
rawdata as (
	SELECT 	counts.spid,
			counts.cells,
			counts.especievalidabusqueda as label,
			counts.niyj as nij,
			counts.nj,
			counts.ni,
			$<N> as n,
			--14707 as n,
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
				cast($<N> as integer)
				--cast(14707 as integer)
			)as numeric), 2)  as epsilon,
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
	select gridid from grid_20km_mx
),
prenorm as (
	select 	allgridis.gridid,
			array_sp,
			tscore
	from basic_score
	inner join allgridis
	on basic_score.gridid = allgridis.gridid
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

