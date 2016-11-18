WITH taxones AS (
  SELECT DISTINCT $<field:name> AS $<field:name>
  FROM sp_snib
  WHERE $<field:name> ~* $<query_name>
)
SELECT 
  *
FROM taxones
LIMIT $<limit> OFFSET 0
