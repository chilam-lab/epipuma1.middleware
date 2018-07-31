WITH gridid_specie AS (
  -- Regresa una tabla con renglones spid y gridid
  SELECT spid,
         UNNEST($<res_celda:name>) AS gridid
         --unnest(cells_32km) as gridid
  FROM sp_snib
  WHERE spid IN ($<spids:csv>)
  --WHERE spid IN (300008)
  UNION
  SELECT bid AS spid,
         UNNEST($<res_celda:name>) AS gridid
         -- unnest(cells_32km) as gridid
  FROM raster_bins
  WHERE bid IN ($<spids:csv>)
  --WHERE bid IN (300008)
),
count_spid AS (
  -- Agrupa para cada gridid el numero de ejemplares que hay
  SELECT  gridid,
          sum(1) conteo
          -- COUNT(spid) as conteo
  FROM gridid_specie
  GROUP BY gridid
  -- ORDER BY cont ASC
),
count_species_present AS (
  -- Regresa una tabla con las especies presentes por celda y los conteos
  -- de las especies de interes
  SELECT
    DISTINCT gridid_specie.gridid,
    (animalia || plantae || fungi || protoctista || prokaryotae) as spids,
    (bio001 || bio002 || bio004 || bio005 || bio006) AS bioclim,
    conteo
  FROM gridid_specie
  LEFT JOIN grid_8km_aoi
  ON gridid_specie.gridid = grid_8km_aoi.$<res_grid:name>
  -- ON gridid_specie.gridid = grid_8km_aoi.GRIDID_32KM
  LEFT JOIN count_spid
  ON grid_8km_aoi.$<res_grid:name> = count_spid.gridid
  -- ON grid_8km_aoi.gridid_32KM = count_spid.gridid
  -- WHERE cont_spid.gridid = 10093
), 
full_counts AS (
  SELECT
    gridid,
    array_accum(spids) AS spids,
    array_accum(bioclim) AS bioclim,
    conteo
  FROM count_species_present
  GROUP BY gridid, conteo
)
SELECT 
  $<columns:name>
  -- gridid,
  -- conteo,
  -- spids,
  -- bioclim
FROM full_counts;
