# Github Profile Trophy

[![Github issues](https://img.shields.io/github/issues/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/issues)
[![Github forks](https://img.shields.io/github/forks/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/network/members)
[![Github stars](https://img.shields.io/github/stars/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/stargazers)
[![Github license](https://img.shields.io/github/license/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/)

🏆 Add dynamically generated GitHub Trophy on your readme

# Demo

<img width="665" src="https://user-images.githubusercontent.com/6661165/91642602-ab9dd480-ea67-11ea-9c9b-e59169b41c81.png">

# Quick Start

Add following code to your readme.  
Change the `?username=` value to your GitHub's username.

```
[![trophy](https://github-profile-trophy.vercel.app/?username=ryo-ma)](https://github.com/ryo-ma/github-profile-trophy)
```

# About Rank

Ranks are `SSS` `SS` `S` `AAA` `AA` `A` `B` `C` `UNKNOWN` `SECRET`.

|  Rank  |  Description  |
| ---- | ---- |
|  SSS, SS, S  | You are hard to reach rank. You can brag.  |
|  AAA, AA, A  | You can reach it if you do your best. Let's aim here first.  |
|  B, C  | You are a growing process.  |
| UNKOWN | You have not yet taken action. Let's act first. |
| SECRET | The rank is very rare. The trophy will not be displayed until the conditions are met. |

# Optional Request Parameters

* [title](#filter-by-titles)
* [rank](#filter-by-ranks)
* [column](#specify-the-maximum-row--column-size)
* [row](#specify-the-maximum-row--column-size)

## Filter by titles

You can filter the display by specifying the titles of trophy.  

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&title=Follower
```
<img width="110" src="https://user-images.githubusercontent.com/6661165/91642632-e3a51780-ea67-11ea-9b38-06f24a2ee692.png">

If You want to specify multiple titles.

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&title=Star,Follower
```

## Filter by ranks

You can filter the display by specifying the ranks.  
`Available values: SECRET SSS SS S AAA AA A B C`

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&rank=S
```

<img width="110" src="https://user-images.githubusercontent.com/6661165/91642657-1cdd8780-ea68-11ea-994b-4568a55cd22a.png">

If You want to specify multiple ranks.

```
https://github-profile-trophy.vercel.app/?username=ryo-ma&rank=S,AAA
```


## Specify the maximum row & column size

You can specify the maximum row and column size.  
`Available value: number`  
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
https://github-profile-trophy.vercel.app/?username=ryo-ma&row=3&column=2
```

<img width="330" src="https://user-images.githubusercontent.com/6661165/91642701-780f7a00-ea68-11ea-8190-c3b2c7b70e7e.png">
