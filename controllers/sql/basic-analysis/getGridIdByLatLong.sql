SELECT 
	--gridid_16km as gridid
	$<res_celda_snib:raw> as gridid,
	"CVE_ENT" as cve_ent, "NOM_ENT" as nom_ent
	$<extra_columns:raw>
from
	$<res_celda_snib_tb:raw>
	--grid_16km_aoi 
where 
	ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	-- dentro: 
	-- ST_Intersects( the_geom, ST_GeomFromText('POINT(-101.25 18.96119047529876)',4326))
	-- fuera: 
	--ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.49841308593749 20.191495886374167)',4326))