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
	SELECT  cast('' as text) generovalido,
			case when type = 1 then
			layer
			else
			(label || ' ' || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric)/10,2)  ||' ºC - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric)/10,2) || ' ºC') 
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
	--where layer = 'bio01'	 
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
			--and especievalidabusqueda <> ''
	group by spid
),
filter_nj AS (
		-- climaticas no tienen tiempo para ser descartadas
		SELECT 	
			spid,
			generovalido,
			especievalidabusqueda,
			$<res_celda:raw> as ids_nj,
			icount($<res_celda:raw>) as nj
		FROM target
),
filter_nij AS(
		select 	filter_nj.spid, 
				icount(filter_ni.ids_ni & filter_nj.ids_nj) AS niyj
		FROM filter_ni, filter_nj --, source, target
		--where filter_ni.spid = source.spid
		--and filter_nj.spid = target.spid
),
counts AS (
	SELECT 	filter_nj.spid,
			filter_nj.generovalido,
			filter_nj.especievalidabusqueda,
			filter_nj.ids_nj as cells,
			filter_nj.nj,
			filter_ni.ni,
			filter_nij.niyj,
			$<N> as n
			--14707 as n,
			
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
	select 	gridid, 
			spid,
			especievalidabusqueda as nom_sp,
			rango,
			label 
	from ( 
		select 	gridid, 
				grid_spid.spid, 
				cast('' as text) as especievalidabusqueda, 
				especievalidabusqueda as rango, 
				especievalidabusqueda as label
		from rawdata 
		join grid_spid 
		on grid_spid.spid = rawdata.spid
		and rawdata.cells @> array [grid_spid.gridid] --elimina celdas descartadas por filtros de tiempo 
	) as total 
	where 	rango <> '' 
			--and rango <> ''  
	order by spid 
)
select gridsps.*,  score 
from gridsps  
join rawdata 
on gridsps.spid = rawdata.spid 
order by score desc
