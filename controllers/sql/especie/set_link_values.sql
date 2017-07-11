insert into gen_link
select 
MD5(random()::text) as token,
-- '{pruba: prueba}'::text as parametros,
'$<params:raw>'::text as parametros, 
--'nicho' as tipo,
$<tipo_analisis> as tipo, 
now() as fecha_creacion
RETURNING token
 