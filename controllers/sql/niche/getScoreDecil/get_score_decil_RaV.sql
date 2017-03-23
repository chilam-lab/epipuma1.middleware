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
	select $<res_grid:raw> as gridid from grid_16km_aoi
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
),
names_col as (
	select 
		decil,
		unnest(array_sp) as specie_data,
		sum(1) as decil_occ
	from deciles 
	group by decil, specie_data 
	order by decil desc
),
names_col_occ as (
	select
		decil,
		( specie_data||'|'||decil_occ ) as specie_data
	from names_col
),
gruop_decil_data as (
	select 	decil,
			array_agg( specie_data ) as arraynames
	from names_col_occ
	group by decil
	order by decil
)
select 
	cast(round( cast(max(tscore) as numeric),2) as float) as l_sup, 
	cast(round( cast(min(tscore) as numeric),2) as float) as l_inf, 
	cast(round( cast(sum(tscore) as numeric),2) as float) as sum, 
	cast(round( cast(avg(tscore) as numeric),2) as float) as avg, 
	deciles.decil, 
	array_agg(distinct gridid) as gridids,
	gruop_decil_data.arraynames
	--array_agg(array_to_string( array_sp,',')) as arraynames
from deciles 
join gruop_decil_data
on deciles.decil = gruop_decil_data.decil
group by deciles.decil, arraynames
order by deciles.decil desc
