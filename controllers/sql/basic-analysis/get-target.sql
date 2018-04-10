SELECT  spid, 
		reinovalido, 
		phylumdivisionvalido, 
		clasevalida, 
		ordenvalido, 
		familiavalida, 
		generovalido, 
		especievalidabusqueda, 
		(%s) as cells, 
		icount(%s) as nj 
FROM sp_snib %s
	and especievalidabusqueda <> ''
	and reinovalido <> ''
	and phylumdivisionvalido <> ''
	and clasevalida <> ''
	and ordenvalido <> ''
	and familiavalida <> ''
	and generovalido <> '', in_cells, in_cells, where_target_bio)