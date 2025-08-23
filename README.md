<div align="center">
  <img width="140" src="https://user-images.githubusercontent.com/6661165/91657958-61b4fd00-eb00-11ea-9def-dc7ef5367e34.png"  alt="GitHub Profile Trophy"/>
  <h2 align="center">GitHub Profile Trophy</h2>
  <p align="center">🏆 Agrega trofeos de estadísticas de GitHub generados dinámicamente en tu README</p>
</div>
<div align="center">

[![stargazers](https://img.shields.io/github/stars/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/stargazers)
[![forks](https://img.shields.io/github/forks/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/network/members)
[![issues](https://img.shields.io/github/issues/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/issues)
[![license](https://img.shields.io/github/license/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/blob/master/LICENSE)
[![share](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Fryo-ma%2Fgithub-profile-trophy)](https://twitter.com/intent/tweet?text=Agrega%20trofeos%20de%20GitHub%20generados%20din%C3%A1micamente%20a%20tu%20readme%0D%0A&url=https%3A%2F%2Fgithub.com%2Fryo-ma%2Fgithub-profile-trophy)

</div>
<p align="center">
  Puedes usar este servicio gratis. Busco patrocinadores para poder mantener este servicio ❤️
</p>
<div align="center">
  <a href="https://github.com/sponsors/ryo-ma">
    <img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=ff69b4" alt="Sponsor"/>
  </a>
</div>

# Inicio rápido

Agrega el siguiente código a tu README. Al pegar el código en el README de tu perfil, cambia el valor de `?username=` por tu usuario de GitHub.

```
[![trophy](https://github-profile-trophy.vercel.app/?username=ryo-ma)](https://github.com/ryo-ma/github-profile-trophy)
```

<p align="center">
  <img src="https://github-profile-trophy.vercel.app/?username=ryo-ma&column=8&rank=SSS,SS,S,AAA,AA,A,B,C" />
</p>

## Usar tema

Agrega el parámetro opcional del tema.

```
[![trophy](https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=onedark)](https://github.com/ryo-ma/github-profile-trophy)
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/92327052-d99b9e00-f091-11ea-9a24-c7ec86982370.png">
</p>

**[Más detalle](#apply-theme)**

# Sobre el rango

Los rangos son `SSS` `SS` `S` `AAA` `AA` `A` `B` `C` `UNKNOWN` `SECRET`.

| Rango      | Descripción                                                                                |
| ---------- | ------------------------------------------------------------------------------------------ |
| SSS, SS, S | Estás en un rango difícil de alcanzar. Puedes presumir.                                    |
| AAA, AA, A | Llegarás a este rango si te esfuerzas. Apuntemos aquí primero.                             |
| B, C       | Estás progresando bien. Apuntemos un poco más alto.                                        |
| UNKNOWN    | Aún no has tomado acción. Actúa primero.                                                   |
| SECRET     | Este rango es muy raro. El trofeo no se mostrará hasta que se cumplan ciertas condiciones.  |

**NOTA: El rango `UNKNOWN` se representa con `?`**

## Rango secreto

La condición de obtención es secreta, pero puedes ver esto.

<p align="center">
  <img width="110" src="https://github.com/user-attachments/assets/40461f38-a317-431c-93d2-a56c2e803cf3" />
</p>

Hay muy pocos trofeos secretos. Por lo tanto, si tienes ideas interesantes para condiciones, consideraré agregar un trofeo. Espero tus contribuciones.

# Sobre los detalles de visualización

<p align="center">
  <img width="220" src="https://user-images.githubusercontent.com/6661165/91642962-6333e600-ea6a-11ea-83af-e371e996bfa6.png" />
</p>

1. Nombre del título del objetivo de agrupación.
2. Rango actual.
3. Título según el rango.
4. Resultado de la agrupación objetivo.
5. Barra de progreso del rango.

# Parámetros opcionales de solicitud

- [title](#filtrar-por-títulos)
- [rank](#filtrar-por-rangos)
- [column](#especificar-el-máximo-de-filas-y-columnas)
- [row](#especificar-el-máximo-de-filas-y-columnas)
- [theme](#aplicar-tema)
- [margin-w](#margen-de-ancho)
- [margin-h](#margen-de-alto)
- [no-bg](#fondo-transparente)
- [no-frame](#ocultar-marcos)

## Filtrar por títulos

Puedes filtrar la visualización especificando los títulos de los trofeos.

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&title=Followers
```

<p align="center">
  <img width="110" src="https://user-images.githubusercontent.com/6661165/92317141-80ebe700-f038-11ea-8501-4015bfbb2cf4.png">
</p>

Si quieres especificar varios títulos.

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&title=Stars,Followers
```

<p align="center">
  <img width="220" src="https://github.com/user-attachments/assets/3b8a1c8b-afcd-49dc-ab18-a439d5c36a83">
</p>

También puedes excluir los trofeos que no quieras mostrar.

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&title=-Stars,-Followers
```

## Filtrar por rangos

Puedes filtrar la visualización especificando los rangos.\
`Valores disponibles: SECRET SSS SS S AAA AA A B C`

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&rank=S
```

<p align="center">
  <img width="110" src="https://user-images.githubusercontent.com/6661165/91642657-1cdd8780-ea68-11ea-994b-4568a55cd22a.png" />
</p>

Si quieres especificar varios rangos.

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&rank=S,AAA
```

<p align="center">
  <img width="220" src="https://github.com/user-attachments/assets/0c2ffca8-4b03-4d46-b1d7-4e1eb6702f68">
</p>

También puedes excluir rangos.

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&rank=-C,-B
```

**NOTA: Como `UNKNOWN` se representa con `?`, para incluirlo o excluirlo usa `rank=?` y `rank=-?` respectivamente**

## Especificar el máximo de filas y columnas

Puedes especificar el máximo de filas y columnas.\
El trofeo se ocultará si excede el rango de ambas filas y columnas.

`Valor disponible: tipo número`\
`Por defecto: column=6 row=3`

Restringir solo fila

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&row=2
```

Restringir solo columna

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&column=2
```

Restringir fila y columna

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&row=2&column=3
```

<p align="center">
  <img width="330" src="https://user-images.githubusercontent.com/6661165/91659474-c07f7400-eb0a-11ea-84f2-eb6b42547829.png">
</p>

Columna adaptativa

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&column=-1
```

Puedes establecer `column` en `-1` para adaptar el ancho al número de trofeos, el parámetro `row` será ignorado.

## Aplicar tema

Temas disponibles.

| tema                        |
| --------------------------- |
| [flat](#flat)               |
| [onedark](#onedark)         |
| [gruvbox](#gruvbox)         |
| [dracula](#dracula)         |
| [monokai](#monokai)         |
| [chalk](#chalk)             |
| [nord](#nord)               |
| [alduin](#alduin)           |
| [darkhub](#darkhub)         |
| [juicyfresh](#juicyfresh)   |
| [buddhism](#buddhism)       |
| [oldie](#oldie)             |
| [radical](#radical)         |
| [onestar](#onestar)         |
| [discord](#discord)         |
| [algolia](#algolia)         |
| [gitdimmed](#gitdimmed)     |
| [tokyonight](#tokyonight)   |
| [matrix](#matrix)           |
| [apprentice](#apprentice)   |
| [dark_dimmed](#dark_dimmed) |
| [dark_lover](#dark_lover)   |
| [kimbie_dark](#kimbie_dark) |
| [aura](#aura)               |

### flat

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=flat
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/92325601-039b9300-f087-11ea-983a-fce8133549ee.png">
</p>

### onedark

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=onedark
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/92327052-d99b9e00-f091-11ea-9a24-c7ec86982370.png">
</p>

### gruvbox

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=gruvbox
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/92315152-e9c56600-f01c-11ea-9536-1bfbb158cfcb.png">
</p>

### dracula

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=dracula
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/92490273-c91f2b00-f22b-11ea-9481-b5daae4d7bc3.png">
</p>

### monokai

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=monokai
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/93725426-2c289e80-fbea-11ea-96a4-f6490ccf2126.png">
</p>

### chalk

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=chalk
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/94294003-1de7d300-ff9a-11ea-91d1-60417a4d919b.png">
</p>

### nord

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=nord
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/94346857-7ab2be80-006a-11eb-9082-36d377ae2531.png">
</p>

### alduin

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=alduin
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/99085932-2a88bf00-260c-11eb-9b26-d2f125773831.png">
</p>

### darkhub

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=darkhub
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/102801126-249ab080-43f8-11eb-91c8-f56f94c35777.png">
</p>

### juicyfresh

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=juicyfresh
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/104810094-edbc8c80-5835-11eb-8c20-a76192a00728.png">
</p>

### buddhism

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=buddhism
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/113709167-2412f500-971d-11eb-9ee5-0ab292cf8b4c.png">
</p>

### oldie

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=oldie
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/113709581-a0a5d380-971d-11eb-8583-770dc4091ebf.png">
</p>

### radical

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=radical
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/116633521-adbc8800-a994-11eb-97c4-e45a32721491.png">
</p>

### onestar

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=onestar
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/122048400-2af46d00-ce1c-11eb-94e0-c2c6ddaf6819.png">
</p>

### discord

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=discord
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/122048628-7dce2480-ce1c-11eb-9792-1e600b384c4d.png">
</p>

### algolia

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=algolia
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/131685203-92a31101-2d93-4d18-b24a-d81a8bb012c5.png">
</p>

### gitdimmed

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=gitdimmed
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/131685406-799a864f-2691-4840-bb71-1db9c087a507.png">
</p>

### tokyonight

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=tokyonight
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/6661165/135482087-27764d6f-53b4-4c2a-8473-32431d12660c.png">
</p>

### matrix

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=matrix
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/31789752/141647414-15cfe279-af12-4746-a886-f494c25c096d.png">
</p>

### apprentice

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=apprentice
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/31789752/144701036-285cdd4b-d687-4ddc-95c2-7ccae9e25a1f.png">
</p>

### dark_dimmed

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=dark_dimmed
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/31789752/147340893-655b9fa5-138f-4f29-91ec-2a17c93822d1.png">
</p>

### dark_lover

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=dark_lover
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/31789752/152659041-de5b23cb-1be8-4e6b-b07b-726127ab8c3a.png">
</p>

### kimbie_dark

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=kimbie_dark
```

<p align="center">
  <img width="660" src="https://user-images.githubusercontent.com/8161064/288417332-408705a4-ae9c-47fe-af1a-9fb08555f526.png">
</p>

### aura

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=aura
```

<p align="center">
  <img width="660" src="https://github.com/user-attachments/assets/18a2266c-9a88-4882-940d-162c0c4d36e0">
</p>

## Margen de ancho

Puedes poner un margen en el ancho entre trofeos.\
`Valor disponible: tipo número`\
`Por defecto: margin-w=0`

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&margin-w=15
```

<p align="center">
  <img width="735" src="https://user-images.githubusercontent.com/6661165/93668661-e0ca9f00-fac8-11ea-9bec-325454f49fb4.png">
</p>

## Margen de alto

Puedes poner un margen en el alto entre trofeos.\
`Valor disponible: tipo número`\
`Por defecto: margin-h=0`

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&margin-h=15
```

<p align="center">
  <img width="110" height="330" src="https://github.com/user-attachments/assets/233dee5b-4491-46cc-884a-39d0aa928752">
</p>

## Ejemplo de diseño

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&column=3&margin-w=15&margin-h=15
```

<p align="center">
  <img width="360" src="https://user-images.githubusercontent.com/6661165/93668677-ff309a80-fac8-11ea-8ae3-3e3e8adbef39.png">
</p>

## Fondo transparente

Puedes hacer el fondo transparente.\
`Valor disponible: tipo booleano (true o false)`\
`Por defecto: no-bg=false`

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&no-bg=true
```

<p align="center">
  <img width="969" src="https://github.com/user-attachments/assets/32d3b63b-7845-42cb-b71c-31abaa673bcb">
</p>

## Ocultar marcos

Puedes ocultar los marcos alrededor de los trofeos.\
`Valor disponible: tipo booleano (true o false)`\
`Por defecto: no-frame=false`

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&no-frame=true
```

<p align="center">
  <img width="936" src="https://github.com/user-attachments/assets/54de15a3-d907-4a50-8117-170aae74d1cd">
</p>

# Guía de contribución

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles.

# Licencia

Este producto está licenciado bajo
[Licencia MIT](https://github.com/ryo-ma/github-profile-trophy/blob/master/LICENSE).