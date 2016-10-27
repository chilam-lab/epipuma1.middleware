WITH sp_snib_extended AS (
	SELECT *, 'Eukaryota'::text AS dominio FROM sp_snib
)
SELECT DISTINCT
	$<field:name> AS name,
	count(*)::integer spp
FROM sp_snib_extended
WHERE $<field:name> <> '' AND
	epitetovalido <> '' AND
	$<parentfield:name> = $<parentitem>
GROUP BY $<field:name> ORDER by $<field:name>;
