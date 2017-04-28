/*getFreqDecil sin filtros*/
-- 4698 rows - 6446ms
-- 4698 rows - 6363ms
WITH source AS (
	SELECT spid,
		--(cells_16km - intset(573324, 581126, 507259) )  as cells
		--(cells_16km)  as cells
		($<res_celda:raw> - (array[$<arg_gridids:raw>] + array[$<discardedDeleted:raw>]::int[]))  as cells
	FROM sp_snib 
	WHERE 
		spid = $<spid>
		--spid = 28923		
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
			--(cells_16km - array[573324, 581126, 507259])  as cells
			--(cells_16km)  as cells
			($<res_celda:raw> - array[$<arg_gridids:raw>])  as cells
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	--WHERE ordenvalido = 'Carnivora'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
),
filter_ni AS (
		SELECT 	spid,
				cells,
				icount( cells ) as ni
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
				cells,
				icount(cells) AS nj
		FROM target 
),
counts AS (
	SELECT 	--source.spid as source_spid,
			filter_nj.spid,
			filter_nj.cells,
			filter_nj.generovalido,
			filter_nj.especievalidabusqueda,
			icount(filter_ni.cells & filter_nj.cells) as niyj,
			filter_ni.ni,
			filter_nj.nj,
			--icount( (source.cells & target.cells) - (array[573324, 581126, 507259] + array[573354, 581129])   ) AS niyj,
			--icount( (source.cells & target.cells) - (array[$<arg_gridids:raw>] + array[$<discardedDeleted:raw>]::int[]) ) AS niyj,
			--icount(target.cells - array[573324, 581126, 507259]) as nj,
			--icount(target.cells - array[$<arg_gridids:raw>] ) as nj,
			--icount(source.cells - (array[573324, 581126, 507259] + array[573354, 581129]) ) as ni,
			--icount(source.cells - array[$<arg_gridids:raw>] ) as ni,
			$<N> as n,
			--14707 as n,
			filter_nj.reinovalido,
			filter_nj.phylumdivisionvalido,
			filter_nj.clasevalida,
			filter_nj.ordenvalido,
			filter_nj.familiavalida
	FROM filter_ni, filter_nj
	where 
	filter_nj.spid <> $<spid>
	--filter_nj.spid <> 28923
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
			) as numeric), 2) as score
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
	select 
		$<res_grid:raw> as gridid
		--gridid_16km as gridid 
	from grid_16km_aoi
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
),
valor_deciles as (
	select 
		cast(round( cast(max(tscore) as numeric),2) as float) as l_sup, 
		cast(round( cast(min(tscore) as numeric),2) as float) as l_inf, 
		cast(round( cast(sum(tscore) as numeric),2) as float) as sum, 
		cast(round( cast(avg(tscore) as numeric),2) as float) as avg, 
		deciles.decil, 
		array_agg(distinct gridid) as gridids
	from deciles 
	group by deciles.decil --, arraynames
)
select l_sup, l_inf, sum, avg, valor_deciles.decil, gridids, arraynames
from valor_deciles
join gruop_decil_data
on valor_deciles.decil = gruop_decil_data.decil
order by valor_deciles.decil desc
