${source:raw},
${target:raw}
SELECT
	1 AS grp,
	source.biotic,
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
		(source.bid::text) ) AS id_node,
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
	source.label,
    source.bid,
    source.tag,
    source.icat,
	array_length(source.cells, 1) AS occ
FROM source
UNION
SELECT
	2 AS grp,
	target.biotic,
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
		(target.bid::text) ) AS id_node, 
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
	target.label,
    target.bid,
    target.tag,
    target.icat,
	array_length(target.cells, 1) AS occ
FROM target
ORDER BY reinovalido, 
		 phylumdivisionvalido,
		 clasevalida,
		 ordenvalido,
    	 familiavalida,
    	 generovalido, 
    	 especieepiteto,
    	 nombreinfra,
		 type,
		 layer,
		 bid