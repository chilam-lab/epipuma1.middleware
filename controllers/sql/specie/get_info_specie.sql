WITH grid_with_specie AS (
  SELECT gridid, geom AS grid_geom 
    FROM sp_grid_terrestre
    WHERE 
      animalia ||
      plantae ||
      fungi ||
      protoctista ||
      prokaryotae ||
      animalia_exoticas ||
      plantae_exoticas ||
      fungi_exoticas ||
      protoctista_exoticas ||
      prokaryotae_exoticas @> ARRAY[$<spid>::integer]
  ),
ocupacion AS (
  SELECT count(*) AS occ_cell 
  FROM grid_with_specie
)
SELECT DISTINCT 
  st_asgeojson(s.the_geom) AS json_geom,
  g.gridid,
  s.entid,
  ocupacion.occ_cell::integer,
  s.urlejemplar,
  s.fechacolecta
FROM snib AS s
JOIN grid_with_specie AS g
ON ST_Contains(g.grid_geom, s.the_geom),
  ocupacion
WHERE spid = $<spid> ORDER BY gridid
