SELECT cast(a.$<gridid:raw> as text) AS gridid, a."$<col_name:raw>" as name
FROM $<grid_table:raw> AS a 
WHERE ST_Intersects(a.the_geom, ST_SetSRID(ST_Point($<longitud:raw>, $<latitud:raw>), 4326))