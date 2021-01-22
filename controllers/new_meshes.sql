#pg_dump -t grid_cuekm_aoi niche_candidate | psql niche_integration

ALTER TABLE grid_cuekm_aoi ALTER COLUMN the_geom TYPE Geometry(Polygon, 4326) USING ST_SetSRID(the_geom::Geometry, 4326);

ALTER TABLE grid_cuekm_aoi ALTER COLUMN small_geom TYPE Geometry(Polygon, 4326) USING ST_SetSRID(small_geom::Geometry, 4326);

ALTER TABLE grid_cuekm_aoi ALTER COLUMN geom TYPE Geometry(Polygon, 4326) USING ST_SetSRID(geom::Geometry, 4326);

ALTER TABLE grid_cuekm_aoi DROP COLUMN IF EXISTS plantae;
ALTER TABLE grid_cuekm_aoi DROP COLUMN IF EXISTS animalia;
ALTER TABLE grid_cuekm_aoi DROP COLUMN IF EXISTS fungi;
ALTER TABLE grid_cuekm_aoi DROP COLUMN IF EXISTS protoctista;
ALTER TABLE grid_cuekm_aoi DROP COLUMN IF EXISTS prokaryotae;

ALTER TABLE grid_cuekm_aoi ADD COLUMN plantae integer[]; 
ALTER TABLE grid_cuekm_aoi ADD COLUMN animalia integer[]; 
ALTER TABLE grid_cuekm_aoi ADD COLUMN fungi integer[]; 
ALTER TABLE grid_cuekm_aoi ADD COLUMN protoctista integer[]; 
ALTER TABLE grid_cuekm_aoi ADD COLUMN prokaryotae integer[];

CREATE INDEX idx_grid_cuekm_aoi_grid_cuekm ON grid_cuekm_aoi(gridid_cuekm);
CREATE INDEX idx_grid_cuekm_aoi_small_geom  ON grid_cuekm_aoi USING GIST (small_geom);
CREATE INDEX idx_grid_cuekm_aoi_the_geom ON grid_cuekm_aoi USING GIST (the_geom);
CREATE INDEX idx_grid_cuekm_aoi_geom ON grid_cuekm_aoi USING GIST (geom);


CREATE SEQUENCE grid_geojson_cuekm_aoi_seq start 1;

CREATE materialized view grid_geojson_cuekm_aoi as SELECT nextval('grid_geojson_cuekm_aoi_seq'::regclass) AS footprint_region,
	    json_build_object('type', 'FeatureCollection', 'crs', json_build_object('type', 'name', 'properties', json_build_object('name', 'urn:ogc:def:crs:EPSG::4326')), 'features', json_agg(json_build_object('type', 'Feature', 'geometry', st_asgeojson(grid_cuekm_aoi.small_geom)::json, 'properties', json_build_object('gridid', grid_cuekm_aoi.gridid_cuekm)))) AS json,
	    (ARRAY( SELECT DISTINCT grid_cuekm_aoi_1.gridid_cuekm
	           FROM grid_cuekm_aoi grid_cuekm_aoi_1
	             LEFT JOIN aoi aoi_1 ON st_intersects(grid_cuekm_aoi_1.small_geom, aoi_1.geom)
	          WHERE aoi_1.country::text = 'MEXICO'::text))::integer[] AS cells,
	    st_envelope(st_union(ARRAY( SELECT aoi_1.geom
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'MEXICO'::text))) AS border,
	    ARRAY( SELECT aoi_1.gid
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'MEXICO'::text) AS gid
	   FROM grid_cuekm_aoi
	     LEFT JOIN aoi ON st_intersects(grid_cuekm_aoi.small_geom, aoi.geom)
	  WHERE aoi.country::text = 'MEXICO'::text
  	UNION ALL 
  	SELECT nextval('grid_geojson_cuekm_aoi_seq'::regclass) AS footprint_region,
	    json_build_object('type', 'FeatureCollection', 'crs', json_build_object('type', 'name', 'properties', json_build_object('name', 'urn:ogc:def:crs:EPSG::4326')), 'features', json_agg(json_build_object('type', 'Feature', 'geometry', st_asgeojson(grid_cuekm_aoi.small_geom)::json, 'properties', json_build_object('gridid', grid_cuekm_aoi.gridid_cuekm)))) AS json,
	    (ARRAY( SELECT DISTINCT grid_cuekm_aoi_1.gridid_cuekm
	           FROM grid_cuekm_aoi grid_cuekm_aoi_1
	             LEFT JOIN aoi aoi_1 ON st_intersects(grid_cuekm_aoi_1.small_geom, aoi_1.geom)
	          WHERE aoi_1.country::text = 'UNITED STATES, THE'::text))::integer[] AS cells,
	    st_envelope(st_union(ARRAY( SELECT aoi_1.geom
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'UNITED STATES, THE'::text))) AS border,
	    ARRAY( SELECT aoi_1.gid
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'UNITED STATES, THE'::text) AS gid
	   FROM grid_cuekm_aoi
	     LEFT JOIN aoi ON st_intersects(grid_cuekm_aoi.small_geom, aoi.geom)
	  WHERE aoi.country::text = 'UNITED STATES, THE'::text
	UNION ALL 
	SELECT nextval('grid_geojson_cuekm_aoi_seq'::regclass) AS footprint_region,
	    json_build_object('type', 'FeatureCollection', 'crs', json_build_object('type', 'name', 'properties', json_build_object('name', 'urn:ogc:def:crs:EPSG::4326')), 'features', json_agg(json_build_object('type', 'Feature', 'geometry', st_asgeojson(grid_cuekm_aoi.small_geom)::json, 'properties', json_build_object('gridid', grid_cuekm_aoi.gridid_cuekm)))) AS json,
	    (ARRAY( SELECT DISTINCT grid_cuekm_aoi_1.gridid_cuekm
	           FROM grid_cuekm_aoi grid_cuekm_aoi_1
	             LEFT JOIN aoi aoi_1 ON st_intersects(grid_cuekm_aoi_1.small_geom, aoi_1.geom)
	          WHERE aoi_1.country::text = 'UNITED STATES, THE'::text or aoi_1.country::text='MEXICO'))::integer[] AS cells,
	    st_envelope(st_union(ARRAY( SELECT aoi_1.geom
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'UNITED STATES, THE'::text or aoi_1.country::text='MEXICO'))) AS border,
	    ARRAY( SELECT aoi_1.gid
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'UNITED STATES, THE'::text or aoi_1.country::text='MEXICO') AS gid
	   FROM grid_cuekm_aoi
	     LEFT JOIN aoi ON st_intersects(grid_cuekm_aoi.small_geom, aoi.geom)
	  WHERE aoi.country::text = 'UNITED STATES, THE'::text or aoi.country::text='MEXICO'
	UNION ALL
	SELECT nextval('grid_geojson_cuekm_aoi_seq'::regclass) AS footprint_region,
	    json_build_object('type', 'FeatureCollection', 'crs', json_build_object('type', 'name', 'properties', json_build_object('name', 'urn:ogc:def:crs:EPSG::4326')), 'features', json_agg(json_build_object('type', 'Feature', 'geometry', st_asgeojson(grid_cuekm_aoi.small_geom)::json, 'properties', json_build_object('gridid', grid_cuekm_aoi.gridid_cuekm)))) AS json,
	    (ARRAY( SELECT DISTINCT grid_cuekm_aoi_1.gridid_cuekm
	           FROM grid_cuekm_aoi grid_cuekm_aoi_1
	             LEFT JOIN aoi aoi_1 ON st_intersects(grid_cuekm_aoi_1.small_geom, aoi_1.geom)
	          WHERE aoi_1.country::text = 'COLOMBIA'::text))::integer[] AS cells,
	    st_envelope(st_union(ARRAY( SELECT aoi_1.geom
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'COLOMBIA'::text))) AS border,
	    ARRAY( SELECT aoi_1.gid
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'COLOMBIA'::text) AS gid
	   FROM grid_cuekm_aoi
	     LEFT JOIN aoi ON st_intersects(grid_cuekm_aoi.small_geom, aoi.geom)
	  WHERE aoi.country::text = 'COLOMBIA'::text
	UNION ALL
	SELECT nextval('grid_geojson_cuekm_aoi_seq'::regclass) AS footprint_region,
	    json_build_object('type', 'FeatureCollection', 'crs', json_build_object('type', 'name', 'properties', json_build_object('name', 'urn:ogc:def:crs:EPSG::4326')), 'features', json_agg(json_build_object('type', 'Feature', 'geometry', st_asgeojson(grid_cuekm_aoi.small_geom)::json, 'properties', json_build_object('gridid', grid_cuekm_aoi.gridid_cuekm)))) AS json,
	    (ARRAY( SELECT DISTINCT grid_cuekm_aoi_1.gridid_cuekm
	           FROM grid_cuekm_aoi grid_cuekm_aoi_1
	             LEFT JOIN aoi aoi_1 ON st_intersects(grid_cuekm_aoi_1.small_geom, aoi_1.geom)
	          WHERE aoi_1.country::text = 'COLOMBIA'::text or aoi_1.country::text = 'BELIZE' or aoi_1.country::text = 'COSTA RICA' or aoi_1.country::text = 'EL SALVADOR' or aoi_1.country::text = 'GUATEMALA' or aoi_1.country::text = 'HONDURAS' or aoi_1.country::text = 'MEXICO' or aoi_1.country::text = 'NICARAGUA' or aoi_1.country::text = 'PANAMA'))::integer[] AS cells,
	    st_envelope(st_union(ARRAY( SELECT aoi_1.geom
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'COLOMBIA'::text or aoi_1.country::text = 'BELIZE' or aoi_1.country::text = 'COSTA RICA' or aoi_1.country::text = 'EL SALVADOR' or aoi_1.country::text = 'GUATEMALA' or aoi_1.country::text = 'HONDURAS' or aoi_1.country::text = 'MEXICO' or aoi_1.country::text = 'NICARAGUA' or aoi_1.country::text = 'PANAMA'))) AS border,
	    ARRAY( SELECT aoi_1.gid
	           FROM aoi aoi_1
	          WHERE aoi_1.country::text = 'COLOMBIA'::text or aoi_1.country::text = 'BELIZE' or aoi_1.country::text = 'COSTA RICA' or aoi_1.country::text = 'EL SALVADOR' or aoi_1.country::text = 'GUATEMALA' or aoi_1.country::text = 'HONDURAS' or aoi_1.country::text = 'MEXICO' or aoi_1.country::text = 'NICARAGUA' or aoi_1.country::text = 'PANAMA') AS gid
	   FROM grid_cuekm_aoi
	     LEFT JOIN aoi ON st_intersects(grid_cuekm_aoi.small_geom, aoi.geom)
	  WHERE aoi.country::text = 'COLOMBIA'::text or aoi.country::text = 'BELIZE' or aoi.country::text = 'COSTA RICA' or aoi.country::text = 'EL SALVADOR' or aoi.country::text = 'GUATEMALA' or aoi.country::text = 'HONDURAS' or aoi.country::text = 'MEXICO' or aoi.country::text = 'NICARAGUA' or aoi.country::text = 'PANAMA';

ALTER TABLE snib ADD COLUMN gridid_cuekm text;

select array_length(cells, 1) from grid_geojson_cuekm_aoi;

/*


for((i=2;i<=870398;i++))
do
	echo "Point ... $i / 870398"
	psql -d niche_integration -c "UPDATE geo_snib set gridid_statekm = grid_statekm_aoi.gridid_statekm FROM grid_statekm_aoi, points_snib WHERE st_intersects(geo_snib.the_geom, grid_statekm_aoi.the_geom) and points_snib.id = $i and geo_snib.geoid = points_snib.geoid";
	psql -d niche_integration -c "UPDATE geo_snib set gridid_munkm = grid_munkm_aoi.gridid_munkm FROM grid_munkm_aoi, points_snib WHERE st_intersects(geo_snib.the_geom, grid_munkm_aoi.the_geom) and points_snib.id = $i and geo_snib.geoid = points_snib.geoid"; 
	psql -d niche_integration -c "UPDATE geo_snib set gridid_agebkm = grid_agebkm_aoi.gridid_agebkm FROM grid_agebkm_aoi, points_snib WHERE st_intersects(geo_snib.the_geom, grid_agebkm_aoi.the_geom) and points_snib.id = $i and geo_snib.geoid = points_snib.geoid";
	psql -d niche_integration -c "UPDATE geo_snib set gridid_cuekm = grid_cuekm_aoi.gridid_cuekm FROM grid_cuekm_aoi, points_snib WHERE st_intersects(geo_snib.the_geom, grid_cuekm_aoi.the_geom) and points_snib.id = $i and geo_snib.geoid = points_snib.geoid";  
done

*/