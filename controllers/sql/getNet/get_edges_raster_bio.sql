/*getGeoRel sin filtros*/
with source AS (
	SELECT  bid as spid,
			$<res_celda:raw> AS cells
			--raster_bins.cells_16km AS cells 
	FROM raster_bins
	--where cells_16km is null
	--where bid = '300012'
	--where layer = 'bio01'
	$<where_config_source_raster:raw>	 	 
),
target AS (
	SELECT  spid,
			$<res_celda:raw> AS cells
			--sp_snib.cells_16km as cells 
	FROM sp_snib
	--where clasevalida = 'Mammalia'
	--WHERE generovalido = 'Lutzomyia'
	$<where_config_target:raw>	 
	and especievalidabusqueda <> ''
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
	--where icount(target.cells) > 0
	where icount(target.cells) > $<min_occ:raw>
	and icount(source.cells) > 0
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
