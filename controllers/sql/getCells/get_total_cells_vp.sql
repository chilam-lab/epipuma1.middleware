select array_agg(cell) as total_cells
from(
	select cell
	from ${tbl_process:raw}
	where iter = ${iter:raw} and tipo_valor = 'test' and sp_obj = FALSE
	-- order by cell
) as t1
group by true