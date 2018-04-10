SELECT DISTINCT $<tax_level:raw> as tax_level,
				especievalidabusqueda as especie
FROM sp_snib 
WHERE
	spid = $<spid>
