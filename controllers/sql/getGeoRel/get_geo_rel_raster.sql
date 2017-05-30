/*getGeoRel sin filtros*/
WITH source AS (
	SELECT spid, 
		--$<res_celda:raw> as cells
		($<res_celda:raw> - array[$<discardedDeleted:raw>]::int[])  as cells
	FROM sp_snib 
	WHERE 
		spid = $<spid>		
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
			--($<res_celda:raw> - array[$<discardedDeleted:raw>]::int[])  as cells  
	FROM raster_bins 
	$<where_config_raster:raw>	 
	
),
counts AS (
	SELECT 	--source.spid as source_spid,
			target.generovalido,
			target.especievalidabusqueda,
			icount(source.cells & target.cells) AS niyj,
			-- verificar cuando se despliega esta operación (ausencia)
			--icount(source.cells | target.cells) AS nioj
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			target.reinovalido,
			target.phylumdivisionvalido,
			target.clasevalida,
			target.ordenvalido,
			target.familiavalida
			 
	FROM source,target
	where target.spid <> $<spid>
	and icount(target.cells) > $<min_occ:raw>
) 
SELECT 	--counts.source_spid,
		--counts.source,
		--counts.generovalido,
		counts.especievalidabusqueda,
		counts.niyj as nij,
		counts.nj,
		counts.ni,
		$<N> as n,
		counts.reinovalido,
		counts.phylumdivisionvalido,
		counts.clasevalida,
		counts.ordenvalido,
		counts.familiavalida,
		
		round( cast(  
			get_epsilon(
				$<alpha>,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast($<N> as integer)
		)as numeric), 2)  as epsilon,
		round( cast(  ln(   
			get_score(
				$<alpha>,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast($<N> as integer)
			)
		)as numeric), 2) as score
FROM counts 
ORDER BY epsilon desc;
