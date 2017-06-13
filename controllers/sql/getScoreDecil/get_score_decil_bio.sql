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
			$<res_celda:raw> as cells 
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
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
/*with rawdata as(
	select 
		out_spid,
		out_reinovalido,
		out_phylumdivisionvalido,
	 	out_clasevalida,
	 	out_ordenvalido,
	 	out_familiavalida,
	 	out_generovalido,
	 	out_especievalidabusqueda,
		avg(out_epsilon) as avg_epsilon,
		avg(out_score) as avg_score
	from iteratevalidationprocess(5, 27332, 14900, 0.01, 0, 'cells_16km', 'where clasevalida = ''Mammalia'' ')
	where out_spid is not null
	group by out_spid, out_reinovalido, out_phylumdivisionvalido, out_clasevalida, out_ordenvalido, out_familiavalida, out_generovalido, out_especievalidabusqueda
	order by out_spid
),*/
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
	FROM prenorm 
	ORDER BY tscore 
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
