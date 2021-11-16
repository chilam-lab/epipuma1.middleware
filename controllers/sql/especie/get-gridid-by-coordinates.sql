SELECT cast(a.$<gridid:raw> as text) AS gridid
FROM $<grid_table:raw> AS a 
WHERE ST_Intersects(a.the_geom, ST_SetSRID(ST_Point($<longitud:raw>, $<latitud:raw>), 4326))