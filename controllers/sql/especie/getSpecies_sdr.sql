with spid_occ as (
	SELECT 
		-- icount(array_agg(distinct gridid_16km)) as occ
		icount(array_agg(distinct a.$<res_celda_snib:raw>)) as occ
	FROM snib AS a
	JOIN (
		SELECT UNNEST(gid) AS gid 
		--FROM grid_geojson_64km_aoi
		FROM ${res_celda_snib_tb:raw}
		--WHERE footprint_region=1 
		WHERE footprint_region=${region}
		) AS b
	ON a.gid = b.gid
	WHERE 	
		a.spid = $<spid> AND
		--a.spid = 27333 and
		a.especievalidabusqueda <> '' and
		--gridid_16km is not null
		$<res_celda_snib:raw> is not null
		$<sfosil:raw> 
		--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
		--and cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf:raw>  as integer)
		and a.aniocolecta >= cast( $<lim_inf:raw>  as integer)
		and a.aniocolecta <= cast( $<lim_sup:raw>  as integer)
		--cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup:raw>  as integer)
	GROUP BY spid
)
SELECT DISTINCT st_asgeojson(a.the_geom) as json_geom, 
				a.$<res_celda_snib:raw> as gridid,
				a.urlejemplar, 
				--fechacolecta,
				a.aniocolecta,
				(SELECT occ FROM spid_occ) as occ
FROM snib AS a
JOIN (
	SELECT UNNEST(gid) AS gid 
	--FROM grid_geojson_64km_aoi
	FROM ${res_celda_snib_tb:raw}
	--WHERE footprint_region=1 
	WHERE footprint_region=${region}
	) AS b
ON a.gid = b.gid
WHERE
	--snib.spid = 27333 and
	a.spid = $<spid> AND
	a.especievalidabusqueda <> '' and
	--gridid_16km is not null
	a.$<res_celda_snib:raw> is not null
	$<sfosil:raw> 
	--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
	and a.aniocolecta >= cast( $<lim_inf:raw>  as integer)
	--and cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf:raw>  as integer)
	and 
	--cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup:raw>  as integer)  
	a.aniocolecta <= cast( $<lim_sup:raw>  as integer)	