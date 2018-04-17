SELECT  spid, 
		reinovalido, 
		phylumdivisionvalido, 
		clasevalida, 
		ordenvalido, 
		familiavalida, 
		generovalido, 
		especievalidabusqueda, 
		array_agg(distinct ${res_celda_snib:raw}) as cells, 
		icount(array_agg(distinct ${res_celda_snib:raw})) as nj
FROM snib ${whereVar:raw} ${fosil:raw}
	and especievalidabusqueda <> ''
	and reinovalido <> ''
	and phylumdivisionvalido <> ''
	and clasevalida <> ''
	and ordenvalido <> ''
	and familiavalida <> ''
	and generovalido <> ''
	and ${res_celda_snib:raw} is not null
	group by spid,
		reinovalido, 
		phylumdivisionvalido, 
		clasevalida, 
		ordenvalido, 
		familiavalida, 
		generovalido, 
		especievalidabusqueda