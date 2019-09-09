${source:raw},
${target:raw},
n_res AS (
	SELECT array_length(cells, 1) AS n
	FROM $<res_views:raw>
	WHERE footprint_region = $<region:raw>
),
counts AS (
	SELECT 	source.biotic AS biotic_s,
		    md5(source.reinovalido|| 
				source.phylumdivisionvalido||
				source.clasevalida||
				source.ordenvalido||
				source.familiavalida||
				source.generovalido|| 
				source.especieepiteto||
				source.nombreinfra||
				(source.type::text)||
				source.layer||
				(source.bid::text) ) AS id_node_source,
		    target.biotic AS biotic_t, 
			md5(target.reinovalido|| 
				target.phylumdivisionvalido||
				target.clasevalida||
				target.ordenvalido||
				target.familiavalida||
				target.generovalido|| 
				target.especieepiteto||
				target.nombreinfra||
				(target.type::text)||
				target.layer||
				(target.bid::text) ) AS id_node_target,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			n_res.n AS n
	FROM source, target, n_res
	--where icount(source.cells & target.cells) > 0
	where icount(target.cells) > $<min_occ:raw>
	and icount(source.cells) > 0
) 
SELECT 	counts.biotic_s,
		counts.biotic_t,
		counts.id_node_source,
		counts.id_node_target,
		counts.niyj as nij,
		counts.nj,
		counts.ni,
		counts.n,
		round( cast(  
			get_epsilon(
				1.0/counts.n,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast(counts.n as integer)
		)as numeric), 2)  as value,
		round( cast( ln(   
			get_score(
				1.0/counts.n,
				cast(counts.nj as integer),
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast(counts.n as integer)
			)
		) as numeric), 2) as score
FROM counts
WHERE counts.id_node_source != counts.id_node_target
ORDER BY value desc, score desc;