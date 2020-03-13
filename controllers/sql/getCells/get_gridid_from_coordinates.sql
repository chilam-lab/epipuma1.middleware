select gridid_$<res:raw>km, st_asgeojson(small_geom) as the_geom
from grid_$<res:raw>km_aoi 
where st_intersects(
		the_geom, st_setsrid(
					st_point(
						$<longitud:raw>, $<latitud:raw>), 4326));