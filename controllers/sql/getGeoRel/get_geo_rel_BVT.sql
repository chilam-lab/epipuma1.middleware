/*getGeoRel con proceso de validación y tiempo*/
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
	$<where_config:raw>
	--WHERE clasevalida = 'Mammalia'
	--WHERE ordenvalido = 'Carnivora'
	and especievalidabusqueda <> ''
),
-- celdas de ni resultantes despues de filtro de tiempo y validación
filter_ni_tv AS (
	SELECT 	spid,
			array_agg(distinct $<res_grid:raw>) - array[$<arg_gridids:raw>] as cells
			--icount(array_agg(distinct gridid)) as ni
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
-- celdas de nj resultantes despues de filtro de tiempo 
filter_nj_tv AS (
	SELECT 	
		snib.spid, 
		array_agg(distinct $<res_grid:raw>) - array[ $<arg_gridids:raw> ] as cells
		--icount(array_agg(distinct gridid)) as nj
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
	--order by spid
	--limit 1
),
-- celdas de nij resultantes despues de filtro de tiempo 
filter_nij_tv AS(
	select 	filter_nj_tv.spid, 
			filter_ni_tv.cells & filter_nj_tv.cells AS cells
			--icount(filter_ni_tiempo.ids_ni & filter_nj_tiempo.ids_nj) AS niyj
	FROM filter_nj_tv, filter_ni_tv
	--order by spid
),
counts AS (
	SELECT 	--source.spid as source_spid,
			target.spid,
			target.generovalido,
			target.especievalidabusqueda,
			icount(filter_nj_tv.cells) as nj,
			icount(filter_ni_tv.cells) as ni,
			icount(filter_nij_tv.cells) as niyj,
			$<N> - icount(array[ $<arg_gridids:raw> ]) as n,
			--14707 - icount(array[ $<arg_gridids:raw> ]) as n,
			target.reinovalido,
			target.phylumdivisionvalido,
			target.clasevalida,
			target.ordenvalido,
			target.familiavalida
	FROM 	target, 
			filter_ni_tv, filter_nj_tv, filter_nij_tv
	where 	
			target.spid <> $<spid>
			--target.spid <> 33553
			--and source.spid = filter_ni.spid
			and target.spid = filter_nj_tv.spid
			and target.spid = filter_nij_tv.spid
			and icount(filter_nj_tv.cells) > $<min_occ:raw>
			--and icount(filter_nj_tv.cells) > 0
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
