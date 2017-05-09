SELECT 
	lower(entidad) as name, 
	st_asgeojson(st_simplify(the_geom,0.01,true)) as json_geom, 
	entid as cve 
FROM public.estados