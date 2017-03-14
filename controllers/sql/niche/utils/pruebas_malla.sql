/*
xmin: '-95.888671875',
  ymin: '12.576009912063801',
  xmax: '-81.9140625',
  ymax: '19.041348796589013'
  st_intersects(geom, ST_MakeEnvelope (-95.888671875, 12.576009912063801, -81.9140625, 19.041348796589013, 4326))
  st_intersects(geom, ST_MakeEnvelope (-112.9833984375, 17.20376982191752, -85.0341796875, 29.516110386062277, 4326))
**/
/*with countries as (
	select array_agg(gid) arg_countries 
	from america
	where st_intersects(geom, ST_MakeEnvelope (-112.9833984375, 17.20376982191752, -85.0341796875, 29.516110386062277, 4326))	 
)*/

select st_asgeojson(the_geom) geom, gridid 
FROM public.gridsm_20km
where st_intersects(the_geom, ST_MakeEnvelope (-112.9833984375, 17.20376982191752, -85.0341796875, 29.516110386062277, 4326))

--join countries
--on grid_20km.countries && countries.arg_countries

-- select st_srid(the_geom) gj_geom, st_astext(the_geom), gridid FROM public.grid_20km limit 1 
-- select st_srid(geom) from america limit 1
-- select array_agg(gid) arg_countries from america where st_intersects(geom, ST_MakeEnvelope (-102.48046875, 21.9328547363353, -95.537109375, 25.015928763367857, 4326))

/**************************/
/*
select count(*), gridid, countries FROM public.gridsm_20km
where array_length(countries,1) >= 2
group by gridid, countries
-- select entidad, gid, entid from estados limit 100;
/*
/*************************/

with countries as (
	select gid
	from america
	where st_intersects(geom, ST_MakeEnvelope (-112.9833984375, 17.20376982191752, -85.0341796875, 29.516110386062277, 4326))	 
),
data_countries as (
	select  gridid, unnest(countries) as country 
	FROM public.gridsm_20km
)
-- grid_countries as (
	select distinct gridid
	from data_countries
	where country = 19 
	-- inner join countries
	-- on gid = country
/*)
 * 
select st_asgeojson(the_geom), gridsm_20km.gridid 
from grid_countries
join gridsm_20km
on grid_countries.gridid = gridsm_20km.gridid
where st_intersects(the_geom, ST_MakeEnvelope (-112.9833984375, 17.20376982191752, -85.0341796875, 29.516110386062277, 4326))
*/
/*select st_asgeojson(the_geom) geom, gridid 
FROM public.gridsm_20km 
join countries
on gridsm_20km.countries && countries.arg_countries
and 
st_intersects(the_geom, ST_MakeEnvelope (-112.9833984375, 17.20376982191752, -85.0341796875, 29.516110386062277, 4326))*/