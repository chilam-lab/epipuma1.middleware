/*getFreqDecil sin filtros*/
WITH source AS (
	SELECT spid, 
		--$<res_celda:raw> as cells
		cells_16km as cells
	FROM sp_snib 
	WHERE 
		spid = $<spid>
		--spid = 	28923	
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
			--cells_16km as cells 
	FROM raster_bins 
	--$<where_config_raster:raw>
	--where type = 0	
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
			--94544 as n,
			target.reinovalido,
			target.phylumdivisionvalido,
			target.clasevalida,
			target.ordenvalido,
			target.familiavalida
	FROM source,target
	where 
	target.spid <> $<spid>
	--target.spid <> 28923
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
prenorm as (
	select 	grid_16km_aoi.gridid_16km as gridid,
			array_sp,
			tscore
	from basic_score
	inner join grid_16km_aoi
	on basic_score.gridid = grid_16km_aoi.$<res_grid:raw>
	--on basic_score.gridid = grid_16km_aoi.gridid_16km
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
