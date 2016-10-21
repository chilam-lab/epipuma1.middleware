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
FROM 
  sp_snib LIMIT $<limit> OFFSET 0
