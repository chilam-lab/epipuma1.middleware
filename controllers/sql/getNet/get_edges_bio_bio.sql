with source AS (
	SELECT  spid,
			$<res_celda:raw> AS cells
			--cells_16km AS cells
	FROM sp_snib 
	--WHERE generovalido = 'Aedes'
	$<where_config_source:raw>	 
	and especievalidabusqueda <> ''	 	 
),
target AS (
	 SELECT  spid,
			$<res_celda:raw> AS cells
			--cells_16km AS cells 
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
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
