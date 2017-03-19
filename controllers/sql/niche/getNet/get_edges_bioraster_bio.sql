/*getGeoRel sin filtros*/
with source AS (
	SELECT  spid,
			cells 
	FROM sp_snib 
	--WHERE generovalido = 'Aedes'
	$<where_config_source:raw>	 
	and especievalidabusqueda <> ''
	union
	SELECT  bid as spid,
			cells 
	FROM raster_bins
	--where layer = 'bio01'
	$<where_config_source_raster:raw>	 	 
),
target AS (
	 SELECT  spid,
			cells 
	FROM sp_snib 
	--WHERE generovalido = 'Lutzomyia'
	$<where_config_target:raw>	 
	and especievalidabusqueda <> ''	  
),
counts AS (
	SELECT 	source.spid as source,
			target.spid as target,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			$<N> as n
			--14707 as n
	FROM source,target
	--where icount(source.cells & target.cells) > 0
	where icount(source.cells & target.cells) > $<min_occ:raw>
) 
SELECT 	counts.source,
		counts.target,
		counts.niyj as nij,
		counts.nj,
		counts.ni,
		counts.n,
		round( cast(  
			get_epsilon(
				$<alpha>,
				--0.01,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast(counts.n as integer)
		)as numeric), 2)  as value
FROM counts 
ORDER BY value desc;
