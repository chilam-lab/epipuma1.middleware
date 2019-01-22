select array_agg(cell) as source_cells
from(
	select cell
	from ${tbl_process:raw}
	where iter = ${iter:raw} and tipo_valor = 'test' and sp_obj = TRUE
	-- order by cell
) as t1
group by true