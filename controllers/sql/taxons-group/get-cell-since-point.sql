with points as (
	select unnest(array${points:raw}) as the_geom
)
SELECT gridid_${res:raw}km as gridid
FROM grid_${res:raw}km_aoi as a
JOIN points as b
ON ST_Intersects(a.the_geom, b.the_geom);