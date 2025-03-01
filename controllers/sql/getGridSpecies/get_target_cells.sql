SELECT array_agg(cells) AS target_cells
FROM (
	SELECT DISTINCT b.$<gridid:raw> AS cells
	FROM snib AS b
	JOIN 
		(
			SELECT spid
			FROM sp_snib AS a
			WHERE $<where_target:raw>
			and a.spid is not null
			and array_length(a.$<cells:raw>, 1) > 0
		) AS c
	ON b.spid = c.spid
	WHERE b.$<gridid:raw> is not null
	$<where_filter:raw>
	  AND b.gid = ANY(ARRAY(
					SELECT unnest(gid)
					FROM $<view:raw>
					WHERE footprint_region = $<region:raw>
				))
) as tab_a