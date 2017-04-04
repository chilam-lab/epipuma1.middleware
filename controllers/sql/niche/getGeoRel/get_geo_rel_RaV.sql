/*getGeoRel con proceso de validación*/
WITH source AS (
	SELECT spid, 
			--$<res_celda:raw> as cells
			($<res_celda:raw> - (array[$<arg_gridids:raw>] + array[$<discardedDeleted:raw>]::int[]))  as cells  
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
			--$<res_celda:raw> as cells
			($<res_celda:raw> - array[$<arg_gridids:raw>])  as cells  
	FROM raster_bins 
	$<where_config_raster:raw>	 
),
filter_ni AS (
		SELECT 	spid, 
				icount( cells - array[$<arg_gridids:raw>] ) as ni,
				cells - array[$<arg_gridids:raw>] as cells
				--icount( cells & array[ 573324, 581126, 507259 ] ) as d_ni
		FROM source 
), 
filter_nj AS(
		select 	spid, 
				icount(cells - array[$<arg_gridids:raw>]) as nj,
				cells - array[$<arg_gridids:raw>] as cells
				--icount(cells & array[ 573324, 581126, 507259 ] ) AS d_nj
		FROM target 
),
filter_nij AS(
		select 	filter_nj.spid, 
				icount(filter_ni.cells & filter_nj.cells ) AS niyj
				--icount(source.cells & target.cells & array[573324, 581126, 507259 ]) AS d_niyj
		FROM filter_ni, filter_nj
),
counts AS (
	SELECT 	--source.spid as source_spid,
			target.generovalido,
			target.especievalidabusqueda,			
			filter_nij.niyj, 
			filter_ni.ni,
			filter_nj.nj,
			$<N> - icount(array[$<arg_gridids:raw>]) as n,
			--14707 - icount(array[573324, 581126, 507259 ]) as n,
			target.reinovalido,
			target.phylumdivisionvalido,
			target.clasevalida,
			target.ordenvalido,
			target.familiavalida
	FROM source, target, filter_ni, filter_nj, filter_nij
	where 	
			target.spid <> $<spid>
			--target.spid <> 33553
			and source.spid = filter_ni.spid
			and target.spid = filter_nj.spid
			and target.spid = filter_nij.spid
			and filter_nj.nj > $<min_occ:raw>
			--and (icount(target.cells) - filter_nj.d_nj) > 0
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