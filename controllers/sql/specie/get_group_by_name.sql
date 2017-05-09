WITH taxones AS (
  SELECT DISTINCT $<field:name>,
    COUNT(*) spp
  FROM sp_snib
  WHERE $<field:name> ~* $<query_name>
  AND $<parentfield:name> ~* $<parent_name>
  AND epitetovalido <> ''
  GROUP BY $<field:name>
)
SELECT 
  *
FROM taxones
LIMIT $<limit> OFFSET 0
