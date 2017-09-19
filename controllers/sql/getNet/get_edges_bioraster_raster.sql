/*getGeoRel sin filtros*/
with source AS (
	SELECT  spid,
			$<res_celda:raw> AS cells 
	FROM sp_snib 
	--WHERE generovalido = 'Aedes'
	$<where_config_source:raw>	 
	and especievalidabusqueda <> ''
	union
	SELECT  bid as spid,
			$<res_celda:raw> as cells 
	FROM raster_bins
	--where layer = 'bio01'
	$<where_config_source_raster:raw>	 	 
),
target AS (
	SELECT  bid as spid,
			$<res_celda:raw> AS cells 
	FROM raster_bins
	--where layer = 'bio01'
	$<where_config_target_raster:raw>	  
),
n_res AS (
	SELECT count(*) AS n FROM $<res_celda_snib_tb:raw>
),
counts AS (
	SELECT 	source.spid as source,
			target.spid as target,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			n_res.n AS n
	FROM source, target, n_res
	--where icount(source.cells & target.cells) > 0
	where icount(target.cells) > $<min_occ:raw>
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
