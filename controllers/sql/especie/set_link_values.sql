WITH link AS (
	insert into gen_link
	select 
	MD5('$<params:raw>'::text) as token,
	-- '{pruba: prueba}'::text as parametros,
	'$<params:raw>'::text as parametros, 
	--'nicho' as tipo,
	$<tipo_analisis> as tipo, 
	now() as fecha_creacion
	WHERE
	    NOT EXISTS (
	        SELECT token FROM gen_link WHERE token = MD5('$<params:raw>'::text)
	    )
)
SELECT MD5('$<params:raw>'::text) as token 