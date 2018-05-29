select array_agg(cell) as cells_sin_sp, ${cells} as cells_con_sp, ${num_iter:raw} as index
from(
	select cell
	from ${tbl_temp:raw}
	where iter = ${num_iter:raw} and tipo_valor = 'test' and sp_obj = FALSE
	order by cell
) as t1
group by true;