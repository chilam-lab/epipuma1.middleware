WITH grid_with_species AS (
	SELECT gridid,
		(animalia ||
		 plantae ||
		 fungi ||
		 protoctista ||
		 prokaryotae ||
		 animalia_exoticas ||
		 plantae_exoticas ||
		 fungi_exoticas ||
		 protoctista_exoticas ||
		 prokaryotae_exoticas ||
		 bio01 ||
		 bio02 ||
		 bio03 ||
		 bio04 ||
		 bio05 ||
		 bio06 ||
		 bio07 ||
		 bio08 ||
		 bio09 ||
		 bio10 ||
		 bio11 ||
		 bio12 ||
		 bio13 ||
		 bio14 ||
		 bio15 ||
		 bio16 ||
		 bio17 ||
		 bio18 ||
		 bio19 ||
		 elevacion ||
		 pendiente ||
		 topidx) AS spids
	FROM sp_grid_terrestre
),
grid_interaction AS (
	SELECT gridid, spids, $<spid_array>::integer[] AS spid_selected
	FROM grid_with_species
	WHERE $<spid_array>::integer[] && spids
),
grid_interaction_extended AS (
	SELECT gridid, spids, UNNEST(spid_selected) AS spid FROM grid_interaction
),
grid_data AS(
	SELECT
		gridid,
		spids,
		spid = ANY(spids) AS bspids
	FROM grid_interaction_extended
)
SELECT
	gridid,
	spids,
	count(bspids)::integer AS count
FROM grid_data
WHERE bspids = TRUE
GROUP BY gridid, spids
ORDER BY gridid
