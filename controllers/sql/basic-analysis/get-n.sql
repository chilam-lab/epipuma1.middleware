-- select count(*) as n from ${res_celda_snib_tb:raw};
select count(*) as n 
from ${res_celda_snib_tb:raw}
join america 
on st_intersects(${res_celda_snib_tb:raw}.small_geom, america.geom)
where america.gid = ${id_country:raw}
-- Revisar la corrección de the_geom con small_geom
-- select count(*) as n 
-- from grid_16km_aoi
-- join aoi 
-- on st_intersects(grid_16km_aoi.the_geom, aoi.geom)
-- where aoi.fgid = 33
