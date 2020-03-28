WITH cell_q as (
	SELECT 
		-- gridid_16km as sp_gridid
		gridid_$<res:raw>km as sp_gridid
	from
		--grid_16km_aoi
		grid_$<res:raw>km_aoi
	where 
		-- ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.65771484375 17.045055770689885)',4326))
		ST_Intersects( the_geom, ST_GeomFromText('POINT($<longitud:raw> $<latitud:raw>)',4326))
),
sp_cells AS (
	$<bio_select:raw>
	$<abio_select:raw>
),
sp_incell as (
	select gridid, generovalido, especieepiteto, coeficiente, unidad, tipo
	from sp_cells, cell_q
	where gridid = sp_gridid
	order by tipo desc
)
select gridid, 
array_agg(generovalido || '|' || especieepiteto || '|' || tipo || '|' || coeficiente || '|' || unidad ) as sp_riqueza,
count(*) as num_riqueza
from sp_incell
group by gridid