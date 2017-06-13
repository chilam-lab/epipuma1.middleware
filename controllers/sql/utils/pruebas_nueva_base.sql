WITH filter AS (
	SELECT array(
		SELECT DISTINCT gridid 
		FROM snib 
		WHERE 	fechacolecta = '' 
				AND spid = 33553 
				AND especievalidabusqueda <> ''
	) AS fcells
), 
source AS (
	SELECT 	sp_snib.spid, sp_snib.especievalidabusqueda,
			(sp_snib.cells-filter.fcells) as cells 
	FROM sp_snib,filter 
	WHERE 
			sp_snib.reinovalido = 'Animalia' 
			AND sp_snib.especievalidabusqueda <> ''
),
target AS (
	SELECT spid,especievalidabusqueda,cells 
	FROM sp_snib 
	WHERE especievalidabusqueda = 'Lynx rufus'
),
counts AS (
	SELECT source.especievalidabusqueda AS source,
			target.especievalidabusqueda AS target,
			icount(source.cells) AS ni,
			icount(target.cells) AS nj,
			icount(source.cells & target.cells) AS niyj,
			icount(source.cells | target.cells) AS nioj 
	FROM source,target
) 
SELECT 	counts.source,
		counts.target,
		counts.ni,
		counts.nj,counts.niyj,counts.nioj,
		get_epsilon(0.01,cast(counts.nj as integer), cast(counts.niyj as integer), cast(counts.ni as integer), cast(14707 as integer)) as epsilon 
FROM counts 
ORDER BY epsilon desc;