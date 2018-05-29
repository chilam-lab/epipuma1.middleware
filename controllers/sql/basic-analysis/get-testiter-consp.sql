select array_agg(cell) as cells, ${num_iter:raw} as index
from(
	select cell
	from ${tbl_temp:raw}
	where iter = ${num_iter:raw} and tipo_valor = 'test' and sp_obj = TRUE
	order by cell
) as t1
group by true;