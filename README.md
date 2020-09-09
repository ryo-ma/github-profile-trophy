<p align="center">
  <img width="140" src="https://user-images.githubusercontent.com/6661165/91657958-61b4fd00-eb00-11ea-9def-dc7ef5367e34.png" />  
  <h2 align="center">Github Profile Trophy</h2>
  <p align="center">🏆 Add dynamically generated GitHub Trophy on your readme</p>
</p>
<p align="center">
  <a href="https://github.com/ryo-ma/github-profile-trophy/issues">
    <img src="https://img.shields.io/github/issues/ryo-ma/github-profile-trophy"/> 
  </a>
  <a href="https://github.com/ryo-ma/github-profile-trophy/network/members">
    <img src="https://img.shields.io/github/forks/ryo-ma/github-profile-trophy"/> 
  </a>  
  <a href="https://github.com/ryo-ma/github-profile-trophy/stargazers">
    <img src="https://img.shields.io/github/stars/ryo-ma/github-profile-trophy"/> 
  </a>
    <a href="https://github.com/ryo-ma/github-profile-trophy/LICENSE">
    <img src="https://img.shields.io/github/license/ryo-ma/github-profile-trophy"/> 
  </a>
</p>
<p align="center">
  </a>
    <a href="https://twitter.com/intent/tweet?text=Add%20dynamically%20generated%20GitHub%20Trophy%20on%20your%20readme%0D%0A&url=https%3A%2F%2Fgithub.com%2Fryo-ma%2Fgithub-profile-trophy">
    <img src="https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Fryo-ma%2Fgithub-profile-trophy"/> 
  </a>
</p>



# Quick Start

Add following code to your readme.  
Change the `?username=` value to your GitHub's username.

```
[![trophy](https://github-profile-trophy.vercel.app/?username=ryo-ma)](https://github.com/ryo-ma/github-profile-trophy)
```

<img src="https://github-profile-trophy.vercel.app/?username=ryo-ma&column=7&rank=SSS,SS,S,AAA,AA,A,B,C" />

## Use theme

Add optional parameter of theme.

```
[![trophy](https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=onedark)](https://github.com/ryo-ma/github-profile-trophy)
```

<img width="660" src="https://user-images.githubusercontent.com/6661165/92327052-d99b9e00-f091-11ea-9a24-c7ec86982370.png">


**[More detail](#apply-theme)**

# About Rank

Ranks are `SSS` `SS` `S` `AAA` `AA` `A` `B` `C` `UNKNOWN` `SECRET`.

|  Rank  |  Description  |
| ---- | ---- |
|  SSS, SS, S  | You are hard to reach the rank. You can brag.  |
|  AAA, AA, A  | You can reach the rank if you do your best. Let's aim here first.  |
|  B, C  | You are a growing process.  |
| UNKOWN | You have not yet taken action. Let's act first. |
| SECRET | The rank is very rare. The trophy will not be displayed until the conditions are met. |

## Secret Rank
The acquisition condition is secret, but you can know the condition by reading this code.

<img width="110" src="https://user-images.githubusercontent.com/6661165/91643641-28cd4780-ea70-11ea-94a9-a51885252700.png" />


There are still few secret trophies.  
Therefore, if you come up with interesting conditions, I am waiting for contributions.

# About Display details

<img width="220" src="https://user-images.githubusercontent.com/6661165/91642962-6333e600-ea6a-11ea-83af-e371e996bfa6.png" />

1. Title name of aggregation target.
2. Current Rank.
3. Title according to rank.
4. Target aggregation result.
5. Next Rank Bar. The road from the current rank to the next rank.


# Optional Request Parameters

* [title](#filter-by-titles)
* [rank](#filter-by-ranks)
* [column](#specify-the-maximum-row--column-size)
* [row](#specify-the-maximum-row--column-size)
* [theme](#apply-theme)

## Filter by titles

You can filter the display by specifying the titles of trophy.  

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&title=Followers
```
<img width="110" src="https://user-images.githubusercontent.com/6661165/92317141-80ebe700-f038-11ea-8501-4015bfbb2cf4.png">


If You want to specify multiple titles.

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&title=Stars,Followers
```

## Filter by ranks

You can filter the display by specifying the ranks.  
`Available values: SECRET SSS SS S AAA AA A B C`

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&rank=S
```

<img width="110" src="https://user-images.githubusercontent.com/6661165/91642657-1cdd8780-ea68-11ea-994b-4568a55cd22a.png" />

If You want to specify multiple ranks.

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&rank=S,AAA
```

## Specify the maximum row & column size

You can specify the maximum row and column size.  
Trophy will be hidden if it exceeds the range of both row and column.

`Available value: number type`  
`Default: column=6 row=3`

Restrict only row
```
https://github-profile-trophy.vercel.app/?username=ryo-ma&row=2
```

Restrict only column
```
https://github-profile-trophy.vercel.app/?username=ryo-ma&column=2
```

Restrict row & column
```
https://github-profile-trophy.vercel.app/?username=ryo-ma&row=2&column=3
```
<img width="330" src="https://user-images.githubusercontent.com/6661165/91659474-c07f7400-eb0a-11ea-84f2-eb6b42547829.png">

## Apply theme

Available themes.

|  theme  |
| ---- |
| [flat](#flat) |
| [onedark](#onedark) |
| [gruvbox](#gruvbox) |
| [dracula](#dracula) |

### flat

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=flat
```

<img width="660" src="https://user-images.githubusercontent.com/6661165/92325601-039b9300-f087-11ea-983a-fce8133549ee.png">

### onedark

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=onedark
```

<img width="660" src="https://user-images.githubusercontent.com/6661165/92327052-d99b9e00-f091-11ea-9a24-c7ec86982370.png">

### gruvbox

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=gruvbox
```

<img width="660" src="https://user-images.githubusercontent.com/6661165/92315152-e9c56600-f01c-11ea-9536-1bfbb158cfcb.png">

### dracula

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&theme=dracula
```

<img width="660" src="https://user-images.githubusercontent.com/6661165/92490273-c91f2b00-f22b-11ea-9481-b5daae4d7bc3.png">


# Contribution Guide

## Environment

* Deno >= v1.3.0
* typescript == 3.9.7
* [Vercel](https://vercel.com/)
* GitHub API v4

## Local Run

Create `.env` file to project root directory, and write your GitHub token to the `.env` file.
Please select the authority of `repo` when creating token.

```
GITHUB_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Run local server.

```
deno run --allow-net --allow-read --allow-env debug.ts
```

Open localhost from your browser.

http://localhost:8080/?username=ryo-ma

## Editor config

Read the [.editorconfig](./.editorconfig)

## Run deno lint

If you want to contribute to my project, you should check the lint with the following command.

```
deno lint --unstable
```
