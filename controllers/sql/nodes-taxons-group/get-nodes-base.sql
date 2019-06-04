${source:raw},
${target:raw}
SELECT
	1 AS grp,
	source.biotic, 
	source.reinovalido, 
	source.phylumdivisionvalido,
	source.clasevalida,
	source.ordenvalido,
    source.familiavalida,
    source.generovalido, 
    source.especieepiteto,
    source.nombreinfra,
	source.type,
	source.layer,
    source.bid,
    source.tag,
    source.icat,
	array_length(source.cells, 1) AS occ
FROM source
UNION
SELECT
	2 AS grp,
	target.biotic, 
	target.reinovalido, 
	target.phylumdivisionvalido,
	target.clasevalida,
	target.ordenvalido,
    target.familiavalida,
    target.generovalido, 
    target.especieepiteto,
    target.nombreinfra,
	target.type,
	target.layer,
    target.bid,
    target.tag,
    target.icat,
	array_length(target.cells, 1) AS occ
FROM target