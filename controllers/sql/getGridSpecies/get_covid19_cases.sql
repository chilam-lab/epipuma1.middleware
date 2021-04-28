SELECT gridid_munkm as gridid, count(*) as cases
FROM snib 
WHERE especievalidabusqueda = 'COVID-19 CONFIRMADO' and
	  aniocolecta <> 9999 and 
	  mescolecta <> 99 and
	  diacolecta <> 99 and
	  diacolecta <> -1 and
	'${lim_inf:raw}' <= make_date(aniocolecta, mescolecta, diacolecta) and 
	make_date(aniocolecta, mescolecta, diacolecta) < '${lim_sup:raw}'
GROUP BY gridid_munkm
