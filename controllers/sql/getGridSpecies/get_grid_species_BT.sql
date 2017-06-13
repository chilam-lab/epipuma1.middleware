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
-- el arreglo contiene las celdas donde la especie objetivo debe ser descartada 
filter_ni AS (
	SELECT 	spid,
			array_agg(distinct $<res_grid:raw>) as ids_ni,
			icount(array_agg(distinct $<res_grid:raw>)) as ni
	FROM snib 
			where --snib.fechacolecta <> ''
			(case when $<caso> = 1 
				  then 
				  		fechacolecta <> '' 
				  when $<caso> = 2 
				  then
				  		cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
						and 
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
				  else
				  		((
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
						and 
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
						)
						or snib.fechacolecta = '')
			end) = true
			--and spid = 33553
			and spid = $<spid>
			and especievalidabusqueda <> ''
	group by spid
),
filter_nj AS (
	SELECT 	
		snib.spid, 
		array_agg(distinct $<res_grid:raw>) as ids_nj,
		icount(array_agg(distinct $<res_grid:raw>)) as nj
	FROM snib, target
	where --snib.fechacolecta <> ''
		(case when $<caso> = 1 
			  then 
			  		fechacolecta <> '' 
			  when $<caso> = 2 
			  then
			  		cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
					and 
					cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
			  else
			  		((
					cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
					and 
					cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
					)
					or snib.fechacolecta = '')
		end) = true
		and snib.spid = target.spid
		and snib.especievalidabusqueda <> ''
	group by snib.spid
	--order by spid
	--limit 1
),
filter_nij AS(
	select 	distinct filter_nj.spid, 
			icount(filter_ni.ids_ni & filter_nj.ids_nj) AS niyj
	FROM filter_ni, filter_nj --, source, target
	--where filter_ni.spid = source.spid
	--and filter_nj.spid = target.spid
),
counts AS (
	SELECT 	--source.spid as source_spid,
			target.spid,
			target.generovalido,
			target.especievalidabusqueda,		
			filter_nj.ids_nj as cells,
			filter_nj.nj,
			filter_ni.ni,
			filter_nij.niyj,
			$<N> as n,
			--14707 as n,
			target.reinovalido,
			target.phylumdivisionvalido,
			target.clasevalida,
			target.ordenvalido,
			target.familiavalida
	FROM target, filter_ni, filter_nj, filter_nij
	where 	
			target.spid <> $<spid>
			--target.spid <> 33553
			--and source.spid = filter_ni.spid
			and target.spid = filter_nj.spid
			and target.spid = filter_nij.spid
			and filter_nj.nj > $<min_occ:raw>
			--and filter_nj.nj > 0
			--and filter_nj.nj < filter_nij.niyj
			order by spid
),
rawdata as (
	SELECT 	counts.spid,
			counts.cells,
			--counts.source,
			--counts.generovalido,
			counts.especievalidabusqueda,
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
	--where spid = 33894
	--order by spid
),
grid_selected as (
	SELECT 
		$<res_grid:raw> as gridid
		--gridid_16km as gridid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
)
select gridid, 
		spid, 
		especievalidabusqueda as nom_sp, 
		rango, 
		label,
		score
from ( 
	select 	gridid, 
			rawdata.spid, 
			rawdata.score, 
			especievalidabusqueda, 
			'' as rango, 
			'' as label 
	from rawdata 
	join grid_selected 
	on intset(grid_selected.gridid) && rawdata.cells 
) as total 
where 	especievalidabusqueda <> '' 
order by score desc  

/*

-- mismos resultados hasta aqui
grid_spid as (
	SELECT $<res_grid:raw> as gridid,
	unnest( $<categorias:raw> ) as spid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
	--order by spid
),
gridsps as ( 
	select 	gridid, spid, 
			especievalidabusqueda as nom_sp, 
			rango, label 
	from ( 
		select 	gridid, 
				grid_spid.spid, 
				especievalidabusqueda, 
				'' as rango, 
				'' as label 
		from rawdata 
		join grid_spid 
		on grid_spid.spid = rawdata.spid 
		and rawdata.cells @> array [grid_spid.gridid] --elimina celdas descartadas por filtros de tiempo 
	) as total 
	where 	especievalidabusqueda <> '' 
			--and rango <> ''  
	order by spid 
)
select gridsps.*,  score 
from gridsps  
join rawdata 
on gridsps.spid = rawdata.spid 
order by score desc
*/

