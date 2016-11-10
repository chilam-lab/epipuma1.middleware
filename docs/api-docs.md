SNIB API
========
**Version:** 0.0.1

### /getGridIds
---
##### ***GET***
**Description:** Response los `id` de las celdas del mapa

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Success |

### /getSpecie
---
##### ***GET***
**Description:** Regresa un conjunto especies filtrado por `nom_sp` o algunas si no
existe filtro


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| nom_sp | query | Palabra de búsqueda para el nombre de una especie | No | string |
| limit | query | Número de resultados que quiere que se despliegen | No | number |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Success |

##### ***POST***
**Description:** Regresa un conjunto especies filtrado por `nom_sp` o algunas si no
existe filtro


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| payload | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Success |

### /getSpecie/{id}
---
##### ***GET***
**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path |  | Yes | long |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Lorem Ipsum Dolot ... |

### /getInteractionCount
---
##### ***GET***
**Description:** Dado un conjunto de especies se devuelven las celdas donde están
presentes, al menos una de ellas, con el conteo de cuantas de ellas
están presentes en dicha celda. Además se devuelve un arreglo con
las especies presentes en dicha celda.


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| cat_spids | query |  | Yes | array |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Success |

##### ***POST***
**Description:** Dado un conjunto de especies se devuelven las celdas donde están
presentes, al menos una de ellas, con el conteo de cuantas de ellas
están presentes en dicha celda. Además se devuelve un arreglo con
las especies presentes en dicha celda.


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| cat_spids | body |  | Yes |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Success |

### /getCountByGroup
---
##### ***GET***
**Description:** Dada una pareja de categorías taxonómicas, padre e hijo, se regresa
el conteo de las categorías taxonómicas inferiores al hijo y su
nombre.


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| field | query |  | No | string |
| parentfield | query |  | No | string |
| parentitem | query |  | No | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Success |

##### ***POST***
**Description:** Dada una pareja de categorías taxonómicas, padre e hijo, se regresa
el conteo de las categorías taxonómicas inferiores al hijo y su
nombre.


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| data | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Success |

### /getRasterVariable/{type}
---
##### ***GET***
**Description:** Devuelve el nombre las capas disponibles para variables climáticas o 
topográficas. Dependiendo el parámetro de `type` que se le pida.


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | path |  | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Success |

### /getRasterVariable/{type}/{layer}
---
##### ***GET***
**Description:** Se obtienen los datos correspondientes a la capa solicitada.


**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| type | path |  | Yes | string |
| layer | path |  | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | Success |
