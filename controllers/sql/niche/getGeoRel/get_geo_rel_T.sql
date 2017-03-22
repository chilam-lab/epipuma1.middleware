/*getGeoRel con proceso de validación*/
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
	
	union
	
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
-- el arreglo contiene las celdas donde la especie objetivo debe ser descartada 
filter_ni AS (
	SELECT 	spid,
			array_agg(distinct $<res_grid:raw>) as ids_ni,
			icount(array_agg(distinct $<res_grid:raw>)) as ni
	FROM snib 
			where --snib.fechacolecta <> ''
			/*((
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( 2000  as integer)
			and 
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( 2020  as integer)
			)
			or snib.fechacolecta = '')*/
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
			array_agg(distinct $<res_grid:raw> ) as ids_nj,
			icount(array_agg(distinct $<res_grid:raw>)) as nj
		FROM snib, target
		where --snib.fechacolecta <> ''
			/*((
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( 2000  as integer)
			and 
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( 2020  as integer)
			)
			or snib.fechacolecta = '')*/
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
		
		union
		
		SELECT  bid as spid,
				cells as ids_nj,
				icount(cells) as nj
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
	SELECT 	--source.spid as source_spid,
			target.spid,
			target.generovalido,
			target.especievalidabusqueda,			
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
) 
SELECT 	--counts.source_spid,
		--counts.source,
		--counts.generovalido,
		counts.especievalidabusqueda,
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
ORDER BY epsilon desc;