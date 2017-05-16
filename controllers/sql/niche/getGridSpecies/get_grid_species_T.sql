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
	SELECT  especievalidabusqueda,
			spid,
			$<res_celda:raw> as cells,
			0 as tipo
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
	union
	SELECT  case when type = 1 then
			layer
			else
			(label || ' ' || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric)/10,2)  ||' ºC - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric)/10,2) || ' ºC') 
			end as especievalidabusqueda,
			bid as spid,
			$<res_celda:raw> as cells,
			1 as tipo
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
			and especievalidabusqueda <> ''
	group by spid
),
filter_nj AS (
	SELECT 	
		snib.spid,
		target.especievalidabusqueda,
		array_agg(distinct $<res_grid:raw>) as ids_nj,
		icount(array_agg(distinct $<res_grid:raw>)) as nj,
		0 as tipo
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
	group by snib.spid, target.especievalidabusqueda
	
	union
	
	SELECT  bid as spid,
			case when type = 1 then
			layer
			else
			(label || ' ' || tag) 
			end as especievalidabusqueda,
			$<res_celda:raw> as ids_nj,
			icount($<res_celda:raw>) as nj,
			1 as tipo
	FROM raster_bins 
	$<where_config_raster:raw>
),
filter_nij AS(
	select 	distinct filter_nj.spid, 
			icount(filter_ni.ids_ni & filter_nj.ids_nj) AS niyj
	FROM filter_ni, filter_nj --, source, target
	--where filter_ni.spid = source.spid
	--and filter_nj.spid = target.spid
),


counts AS (
	SELECT 	filter_nj.spid,
			filter_nj.tipo,
			filter_nj.especievalidabusqueda,
			filter_nj.ids_nj as cells,
			filter_nj.nj,
			filter_ni.ni,
			filter_nij.niyj,
			$<N> as n
			--14707 as n,
	FROM source, target, filter_ni, filter_nj, filter_nij
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
			counts.tipo,
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
	SELECT $<res_grid:raw> as gridid,
	unnest( 
			--animalia||plantae||fungi||protoctista||prokaryotae||
			--bio01||bio02||bio03||bio04||bio05||bio06|| bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19
			$<categorias:raw>
			) as spid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
),
gridsps as ( 
	select 	gridid, 
			spid,
			especievalidabusqueda as nom_sp,
			label
	from ( 
		select 	gridid, 
				grid_spid.spid, 
				case when tipo = 0
				then especievalidabusqueda
				else ''
				end as especievalidabusqueda,
				case when tipo = 1
				then especievalidabusqueda
				else ''
				end as label
		from rawdata 
		join grid_spid 
		on grid_spid.spid = rawdata.spid 
		and rawdata.cells @> array [grid_spid.gridid]
	--) 
	) as total 
	--where 	especievalidabusqueda <> ''  
	order by spid 
)
select gridsps.*,  score 
from gridsps  
join rawdata 
on gridsps.spid = rawdata.spid 
order by score desc
