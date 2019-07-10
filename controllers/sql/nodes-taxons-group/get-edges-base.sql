${source:raw},
${target:raw},
n_res AS (
	SELECT array_length(cells, 1) AS n
	FROM $<res_views:raw>
	WHERE footprint_region = $<region:raw>
),
counts AS (
	SELECT 	source.biotic AS biotic_s, 
			source.reinovalido AS reinovalido_s, 
			source.phylumdivisionvalido AS phylumdivisionvalido_s,
			source.clasevalida AS clasevalida_s,
			source.ordenvalido AS ordenvalido_s,
		    source.familiavalida AS familiavalida_s,
		    source.generovalido AS generovalido_s, 
		    source.especieepiteto AS especieepiteto_s,
		    source.nombreinfra AS nombreinfra_s,
			source.type AS type_s,
			source.layer AS layer_s,
		    source.bid AS bid_s,
		    target.biotic AS biotic_t, 
			target.reinovalido AS reinovalido_t, 
			target.phylumdivisionvalido AS phylumdivisionvalido_t,
			target.clasevalida AS clasevalida_t,
			target.ordenvalido AS ordenvalido_t,
		    target.familiavalida AS familiavalida_t,
		    target.generovalido AS generovalido_t, 
		    target.especieepiteto AS especieepiteto_t,
		    target.nombreinfra nombreinfra_t,
			target.type AS type_t,
			target.layer AS layer_t,
		    target.bid AS bid_t,
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
		counts.reinovalido_s, 
		counts.phylumdivisionvalido_s,
		counts.clasevalida_s,
		counts.ordenvalido_s,
	    counts.familiavalida_s,
	    counts.generovalido_s, 
	    counts.especieepiteto_s,
	    counts.nombreinfra_s,
		counts.type_s,
		counts.layer_s,
	    counts.bid_s,
	    counts.biotic_t, 
		counts.reinovalido_t, 
		counts.phylumdivisionvalido_t,
		counts.clasevalida_t,
		counts.ordenvalido_t,
	    counts.familiavalida_t,
	    counts.generovalido_t, 
	    counts.especieepiteto_t,
	    counts.nombreinfra_t,
		counts.type_t,
		counts.layer_t,
	    counts.bid_t,
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
WHERE counts.reinovalido_s||counts.phylumdivisionvalido_s||counts.clasevalida_s||counts.ordenvalido_s||counts.familiavalida_s||counts.generovalido_s||counts.especieepiteto_s||counts.nombreinfra_s||counts.type_s||counts.layer_s||counts.bid_s !=  counts.reinovalido_t||counts.phylumdivisionvalido_t||counts.clasevalida_t||counts.ordenvalido_t||counts.familiavalida_t||counts.generovalido_t||counts.especieepiteto_t||counts.nombreinfra_t||counts.type_t||counts.layer_t||counts.bid_t
ORDER BY value desc;