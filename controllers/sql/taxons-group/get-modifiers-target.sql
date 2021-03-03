SELECT --modid as id,
	   nombre as modifier,
	   label,
	   descripcion as description
FROM target_modifiers
WHERE (especievalidabusqueda = '${especievalidabusqueda:raw}' and es_pruebas = false)
	  or (es_pruebas = ${es_pruebas:raw} and especievalidabusqueda = '')