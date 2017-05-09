SNIB API
========
**Version:** 0.0.1

### /getGeoRelNiche
---
##### ***GET***
**Description:** Obtiene epsilon y score basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con el cálculo de epsilon y score para cada relación |

##### ***POST***
**Description:** Obtiene epsilon y score basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con el cálculo de epsilon y score para cada relación |

### /getGeoRelNiche_T
---
##### ***GET***
**Description:** Obtiene epsilon y score basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con el cálculo de epsilon y score para cada relación |

##### ***POST***
**Description:** Obtiene epsilon y score basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con el cálculo de epsilon y score para cada relación |

### /getGeoRelNiche_V
---
##### ***GET***
**Description:** Obtiene epsilon y score basados en especie objetivo y grupo de variables seleccionado. Descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con el cálculo de epsilon y score para cada relación |

##### ***POST***
**Description:** Obtiene epsilon y score basados en especie objetivo y grupo de variables seleccionado. Descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con el cálculo de epsilon y score para cada relación |

### /getGeoRelNiche_VT
---
##### ***GET***
**Description:** Obtiene epsilon y score basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo y descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con el cálculo de epsilon y score para cada relación |

##### ***POST***
**Description:** Obtiene epsilon y score basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo y descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con el cálculo de epsilon y score para cada relación |

### /getFreqNiche
---
##### ***GET***
**Description:** Obtiene la frecuencia de epsilon y score por especie, basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de epsilon y score por especie |

##### ***POST***
**Description:** Obtiene la frecuencia de epsilon y score por especie, basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de epsilon y score por especie |

### /getFreqNiche_T
---
##### ***GET***
**Description:** Obtiene la frecuencia de epsilon y score por especie, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de epsilon y score por especie |

##### ***POST***
**Description:** Obtiene la frecuencia de epsilon y score por especie, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de epsilon y score por especie |

### /getFreqNiche_V
---
##### ***GET***
**Description:** Obtiene la frecuencia de epsilon y score por especie, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de epsilon y score por especie |

##### ***POST***
**Description:** Obtiene la frecuencia de epsilon y score por especie, basados en especie objetivo y grupo de variables seleccionado. escarta los registros que son utilizados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de epsilon y score por especie |

### /getFreqNiche_VT
---
##### ***GET***
**Description:** Obtiene la frecuencia de epsilon y score por especie, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo y descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de epsilon y score por especie |

##### ***POST***
**Description:** Obtiene la frecuencia de epsilon y score por especie, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo y descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de epsilon y score por especie |

### /getFreqMapNiche
---
##### ***GET***
**Description:** Obtiene la suma de score por celda para desplegar un mapa de presencia, basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con los id de celdas y su score relacionado |

##### ***POST***
**Description:** Obtiene la suma de score por celda para desplegar un mapa de presencia, basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con los id de celdas y su score relacionado |

### /getFreqMapNiche_T
---
##### ***GET***
**Description:** Obtiene la suma de score por celda para desplegar un mapa de presencia, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con los id de celdas y su score relacionado |

##### ***POST***
**Description:** Obtiene la suma de score por celda para desplegar un mapa de presencia, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con los id de celdas y su score relacionado |

### /getFreqMapNiche_A
---
##### ***GET***
**Description:** Obtiene la suma de score por celda para desplegar un mapa de presencia, basados en especie objetivo y grupo de variables seleccionado. Se suma el valor a priori a la suma por celda, el valor a priori es calculado con la fórmula: ln(ni / (n - ni))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| apriori | query | Bandera que confirma si se desea sumar a priori  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con los id de celdas y su score relacionado |

##### ***POST***
**Description:** Obtiene la suma de score por celda para desplegar un mapa de presencia, basados en especie objetivo y grupo de variables seleccionado. Suma el valor a priori a la suma por celda con la fórmula: ln(ni / (n - ni))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| apriori | query | Bandera que confirma si se desea sumar a priori  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con los id de celdas y su score relacionado |

### /getFreqMapNiche_M
---
##### ***GET***
**Description:** Obtiene la suma de score por celda para desplegar un mapa de presencia, basados en especie objetivo y grupo de variables seleccionado. Se obtiene la probabilidad de presencia con la fórmula: exp(score+apriori) / (1 + exp(score+apriori))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| mapa_prob | query | Bandera que confirma si se desea el resultado como probabilidad  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con los id de celdas y su score relacionado |

##### ***POST***
**Description:** Obtiene la suma de score por celda para desplegar un mapa de presencia, basados en especie objetivo y grupo de variables seleccionado. Se obtiene la probabilidad de presencia con la fórmula: exp(score+apriori) / (1 + exp(score+apriori))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| mapa_prob | query | Bandera que confirma si se desea el resultado como probabilidad  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con los id de celdas y su score relacionado |

### /getFreqCeldaNiche
---
##### ***GET***
**Description:** Obtiene la frecuencia de score por celda, basados en especie objetivo y grupo de variables seleccionado.


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de score por celda |

##### ***POST***
**Description:** Obtiene la frecuencia de score por celda, basados en especie objetivo y grupo de variables seleccionado.


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de score por celda |

### /getFreqCeldaNiche_T
---
##### ***GET***
**Description:** Obtiene la frecuencia de score por celda, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de score por celda |

##### ***POST***
**Description:** Obtiene la frecuencia de score por celda, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de score por celda |

### /getFreqCeldaNiche_V
---
##### ***GET***
**Description:** Obtiene la frecuencia de score por celda, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de score por celda |

##### ***POST***
**Description:** Obtiene la frecuencia de score por celda, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de score por celda |

### /getFreqCeldaNiche_A
---
##### ***GET***
**Description:** Obtiene la frecuencia de score por celda, basados en especie objetivo y grupo de variables seleccionado. Se suma el valor a priori a la suma por celda, el valor a priori es calculado con la fórmula: ln(ni / (n - ni))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| apriori | query | Bandera que confirma si se desea sumar a priori  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de score por celda |

##### ***POST***
**Description:** Obtiene la frecuencia de score por celda, basados en especie objetivo y grupo de variables seleccionado. Se suma el valor a priori a la suma por celda, el valor a priori es calculado con la fórmula: ln(ni / (n - ni))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| apriori | query | Bandera que confirma si se desea sumar a priori  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la freciencia de score por celda |

### /getScoreDecilNiche
---
##### ***GET***
**Description:** Obtiene el score por celda agrupado por decil, basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| groupid | query | Identificador del grupo biotico o abiotico que se esta calculando  | Yes | integer |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con score por celda agrupado por decil |

##### ***POST***
**Description:** Obtiene el score por celda agrupado por decil, basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| groupid | query | Identificador del grupo biotico o abiotico que se esta calculando  | Yes | integer |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con score por celda agrupado por decil |

### /getScoreDecilNiche_T
---
##### ***GET***
**Description:** Obtiene el score por celda agrupado por decil, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| groupid | query | Identificador del grupo biotico o abiotico que se esta calculando  | Yes | integer |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con score por celda agrupado por decil |

##### ***POST***
**Description:** Obtiene el score por celda agrupado por decil, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| groupid | query | Identificador del grupo biotico o abiotico que se esta calculando  | Yes | integer |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con score por celda agrupado por decil |

### /getScoreDecilNiche_V
---
##### ***GET***
**Description:** Obtiene el score por celda agrupado por decil, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| groupid | query | Identificador del grupo biotico o abiotico que se esta calculando  | Yes | integer |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con score por celda agrupado por decil |

##### ***POST***
**Description:** Obtiene el score por celda agrupado por decil, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que son considerados en el proceso de validación


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| groupid | query | Identificador del grupo biotico o abiotico que se esta calculando  | Yes | integer |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con score por celda agrupado por decil |

### /getScoreDecilNiche_A
---
##### ***GET***
**Description:** Obtiene el score por celda agrupado por decil, basados en especie objetivo y grupo de variables seleccionado. Se suma el valor a priori a la suma por celda, el valor a priori es calculado con la fórmula: ln(ni / (n - ni))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| groupid | query | Identificador del grupo biotico o abiotico que se esta calculando  | Yes | integer |
| apriori | query | Bandera que confirma si se desea sumar a priori  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con score por celda agrupado por decil |

##### ***POST***
**Description:** Obtiene el score por celda agrupado por decil, basados en especie objetivo y grupo de variables seleccionado. Se suma el valor a priori a la suma por celda, el valor a priori es calculado con la fórmula: ln(ni / (n - ni))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedids | query | Arreglo de celdas descartadas por el proceso de validación  | Yes | array |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| groupid | query | Identificador del grupo biotico o abiotico que se esta calculando  | Yes | integer |
| apriori | query | Bandera que confirma si se desea sumar a priori  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con score por celda agrupado por decil |

### /getGridSpeciesNiche
---
##### ***GET***
**Description:** Obtiene la suma del score de la celda que intersecta con los parámetros de latitud y longitud enviados, basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| lat | query | Latitud de la coordenada seleccionada  | Yes | float |
| long | query | Longitud de la coordenada seleccionada  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la suma de score por celda que intersecta con la coordenada enviada |

##### ***POST***
**Description:** Obtiene la suma del score de la celda que intersecta con los parámetros de latitud y longitud enviados, basados en especie objetivo y grupo de variables seleccionado


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |
| lat | query | Latitud de la coordenada seleccionada  | Yes | float |
| long | query | Longitud de la coordenada seleccionada  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la suma de score por celda que intersecta con la coordenada enviada |

### /getGridSpeciesNiche_T
---
##### ***GET***
**Description:** Obtiene la suma del score de la celda que intersecta con los parámetros de latitud y longitud enviados, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| lat | query | Latitud de la coordenada seleccionada  | Yes | float |
| long | query | Longitud de la coordenada seleccionada  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la suma de score por celda que intersecta con la coordenada enviada |

##### ***POST***
**Description:** Obtiene la suma del score de la celda que intersecta con los parámetros de latitud y longitud enviados, basados en especie objetivo y grupo de variables seleccionado. Descarta registros que no cumplen con los filtros de tiempo


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |
| lat | query | Latitud de la coordenada seleccionada  | Yes | float |
| long | query | Longitud de la coordenada seleccionada  | Yes | array |
| discardedDateFilterids | query | Bandera que confirma si hay filtros temporales  | Yes | boolean |
| sfecha | query | Bandera que confirma si seran filtrados los registros sin fecha  | Yes | boolean |
| lim_inf | query | Año de inicio para filtrar registros  | Yes | integer |
| lim_sup | query | Año límite para filtrar registros  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la suma de score por celda que intersecta con la coordenada enviada |

### /getGridSpeciesNiche_A
---
##### ***GET***
**Description:** Obtiene la suma del score de la celda que intersecta con los parámetros de latitud y longitud enviados, basados en especie objetivo y grupo de variables seleccionado. Se suma el valor a priori a la suma por celda, el valor a priori es calculado con la fórmula: ln(ni / (n - ni))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| lat | query | Latitud de la coordenada seleccionada  | Yes | float |
| long | query | Longitud de la coordenada seleccionada  | Yes | array |
| apriori | query | Bandera que confirma si se desea sumar a priori  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la suma de score por celda que intersecta con la coordenada enviada |

##### ***POST***
**Description:** Obtiene la suma del score de la celda que intersecta con los parámetros de latitud y longitud enviados, basados en especie objetivo y grupo de variables seleccionado. Se suma el valor a priori a la suma por celda, el valor a priori es calculado con la fórmula: ln(ni / (n - ni))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |
| lat | query | Latitud de la coordenada seleccionada  | Yes | float |
| long | query | Longitud de la coordenada seleccionada  | Yes | array |
| apriori | query | Bandera que confirma si se desea sumar a priori  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la suma de score por celda que intersecta con la coordenada enviada |

### /getGridSpeciesNiche_M
---
##### ***GET***
**Description:** Obtiene la suma del score de la celda que intersecta con los parámetros de latitud y longitud enviados, basados en especie objetivo y grupo de variables seleccionado. Se obtiene la probabilidad de presencia con la fórmula: exp(score+apriori) / (1 + exp(score+apriori))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos  | Yes | array |
| lat | query | Latitud de la coordenada seleccionada  | Yes | float |
| long | query | Longitud de la coordenada seleccionada  | Yes | array |
| mapa_prob | query | Bandera que confirma si se desea el resultado como probabilidad  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la suma de score por celda que intersecta con la coordenada enviada |

##### ***POST***
**Description:** Obtiene la suma del score de la celda que intersecta con los parámetros de latitud y longitud enviados, basados en especie objetivo y grupo de variables seleccionado. Se suma el valor a priori a la suma por celda, el valor a priori es calculado con la fórmula: ln(ni / (n - ni))


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | query | Id de la especie objetivo  | Yes | string |
| tfilters | query | Array que contiene el grupo de variables seleccionado  | Yes | json |
| res_celda | query | Resolución de la malla con la cual se desea hacer el cálculo  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasBios | query | Bandera que confirma si existen variables de tipo biotico  | Yes | boolean |
| hasRaster | query | Bandera que confirma si existen variables de tipo abiotico  | Yes | boolean |
| discardedFilterids | query | Arreglo de celdas de la especie objetivo que fueron descartadas por elimianción de puntos y descartadas por el proceso de validación  | Yes | array |
| lat | query | Latitud de la coordenada seleccionada  | Yes | float |
| long | query | Longitud de la coordenada seleccionada  | Yes | array |
| mapa_prob | query | Bandera que confirma si se desea el resultado como probabilidad  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con la suma de score por celda que intersecta con la coordenada enviada |

### /getEdgesNiche
---
##### ***GET***
**Description:** Obtiene las relaciones entre los grupos de variables seleccionados por medio del valor de epsilon


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| s_tfilters | query | Array que contiene los grupos de variables source  | Yes | json |
| t_tfilters | query | Array que contiene los grupos de variables target  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasbiosource | query | Bandera que confirma si existen variables de tipo biotico en source  | Yes | boolean |
| hasbiotarget | query | Bandera que confirma si existen variables de tipo biotico en target  | Yes | boolean |
| hasrastersource | query | Bandera que confirma si existen variables de tipo abiotico en source  | Yes | boolean |
| hasrastertarget | query | Bandera que confirma si existen variables de tipo abiotico en target  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con las relaciones de los grupos de variables seleccionados |

##### ***POST***
**Description:** Obtiene las relaciones entre los grupos de variables seleccionados por medio del valor de epsilon


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| s_tfilters | query | Array que contiene los grupos de variables source  | Yes | json |
| t_tfilters | query | Array que contiene los grupos de variables target  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasbiosource | query | Bandera que confirma si existen variables de tipo biotico en source  | Yes | boolean |
| hasbiotarget | query | Bandera que confirma si existen variables de tipo biotico en target  | Yes | boolean |
| hasrastersource | query | Bandera que confirma si existen variables de tipo abiotico en source  | Yes | boolean |
| hasrastertarget | query | Bandera que confirma si existen variables de tipo abiotico en target  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con las relaciones de los grupos de variables seleccionados |

### /getNodesNiche
---
##### ***GET***
**Description:** Obtiene las variables bióticas y abióticas entre los grupos de variables seleccionados por medio del valor de epsilon


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| s_tfilters | query | Array que contiene los grupos de variables source  | Yes | json |
| t_tfilters | query | Array que contiene los grupos de variables target  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasbiosource | query | Bandera que confirma si existen variables de tipo biotico en source  | Yes | boolean |
| hasbiotarget | query | Bandera que confirma si existen variables de tipo biotico en target  | Yes | boolean |
| hasrastersource | query | Bandera que confirma si existen variables de tipo abiotico en source  | Yes | boolean |
| hasrastertarget | query | Bandera que confirma si existen variables de tipo abiotico en target  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con las variables bióticas y abióticas de los grupos de variables seleccionados |

##### ***POST***
**Description:** description: Retorna un objeto json con las variables bióticas y abióticas de los grupos de variables seleccionados


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| s_tfilters | query | Array que contiene los grupos de variables source  | Yes | json |
| t_tfilters | query | Array que contiene los grupos de variables target  | Yes | json |
| res_celda | query | Nombre de la columna de las ocurrencias de las especies a una resolución determinada  | Yes | string |
| res_grid | query | Nombre de la columna de las celdas de la malla a una resolución determinada  | Yes | string |
| min_occ | query | Mínimo de celdas ocupadas por nj para ser considerado en el cálculo de epsilon y score  | Yes | string |
| hasbiosource | query | Bandera que confirma si existen variables de tipo biotico en source  | Yes | boolean |
| hasbiotarget | query | Bandera que confirma si existen variables de tipo biotico en target  | Yes | boolean |
| hasrastersource | query | Bandera que confirma si existen variables de tipo abiotico en source  | Yes | boolean |
| hasrastertarget | query | Bandera que confirma si existen variables de tipo abiotico en target  | Yes | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Retorna un objeto json con las variables bióticas y abióticas de los grupos de variables seleccionados |
