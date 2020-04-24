${aux:raw},
summary AS (
	${summary:raw}
) 
SELECT 
	gridid, 
	count(*) AS conteo
FROM 
	summary
GROUP BY 
	gridid

    
