SELECT  spid, 
		reinovalido, 
		phylumdivisionvalido, 
		clasevalida, 
		ordenvalido, 
		familiavalida, 
		generovalido, 
		especievalidabusqueda, 
		${res_celda_sp:raw} as cells, 
		icount(${res_celda_sp:raw}) as nj 
FROM sp_snib ${whereVar:raw}
	and especievalidabusqueda <> ''
	and reinovalido <> ''
	and phylumdivisionvalido <> ''
	and clasevalida <> ''
	and ordenvalido <> ''
	and familiavalida <> ''
	and generovalido <> ''