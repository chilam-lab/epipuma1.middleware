/*Agavaceae VS Chiroptera*/
WITH source AS (
	SELECT spid,especievalidabusqueda,cells 
	FROM sp_snib 
	WHERE 
		--familiavalida = 'Agavaceae'
		--especievalidabusqueda = 'Lynx rufus'
		spid = 33553		
		AND especievalidabusqueda <> ''
),
target AS (
	SELECT spid,especievalidabusqueda,cells 
	FROM sp_snib 
	WHERE 
			--ordenvalido = 'Chiroptera'
			clasevalida = 'Mammalia' 
			AND especievalidabusqueda <> ''
),
counts AS (
	SELECT 	--source.spid as source_spid,
			source.especievalidabusqueda AS source,
			target.especievalidabusqueda AS target,
			icount(source.cells) AS ni,
			icount(target.cells) AS nj,
			icount(source.cells & target.cells) AS niyj
			-- verificar cuando se despliega esta operación (ausencia)
			--icount(source.cells | target.cells) AS nioj 
	FROM source,target
	where target.spid <> 33553
) 
SELECT 	--counts.source_spid,
		--counts.source,
		counts.target,
		counts.ni,
		counts.nj,
		counts.niyj,
		round( cast(  
			get_epsilon(
				0.01,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast(14707 as integer)
		)as numeric), 2)  as epsilon,
		round( cast(  ln(   
			get_score(
				0.01,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast(14707 as integer)
			)
		)as numeric), 2) as score
FROM counts 
ORDER BY epsilon desc;
