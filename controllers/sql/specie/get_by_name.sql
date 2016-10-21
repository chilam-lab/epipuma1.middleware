SELECT 
  spid, 
  nom_sp, 
  reinovalido,
  phylumdivisionvalido,
  clasevalida,
  ordenvalido,
  familiavalida,
  generovalido,
  epitetovalido
FROM sp_snib 
WHERE to_tsvector(especievalidabusqueda) @@ to_tsquery($<query_name>)
LIMIT $<limit> OFFSET 0
