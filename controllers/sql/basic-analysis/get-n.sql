-- select count(*) as n from ${res_celda_snib_tb:raw};
select count(*) as n 
from ${res_celda_snib_tb:raw}
join america 
on st_intersects(${res_celda_snib_tb:raw}.small_geom, america.geom)
where america.country = '${country:raw}'