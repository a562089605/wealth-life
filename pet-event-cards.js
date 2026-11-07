// User-confirmed 35 pet map cards. Prices are uninsured totals; insurance is applied by pet-events.js.
(function(root){'use strict';const cards={
  "dog-companion": {
    "id": "dog-companion",
    "species": "dog",
    "kind": "companion",
    "title": "一起晒太阳",
    "energy": 3,
    "happiness": 3,
    "stress": -2,
    "cost": 0,
    "hours": 1,
    "medical": false,
    "button": "陪它待一会儿",
    "art": "assets/pets/events/companion-dog-20261105.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "dog-unwell": {
    "id": "dog-unwell",
    "species": "dog",
    "kind": "unwell",
    "title": "毛孩子有点不舒服",
    "cost": 200,
    "hours": 3,
    "energy": -2,
    "stress": 2,
    "medical": true,
    "button": "带它去看医生",
    "art": "assets/pets/events/dog-unwell-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ],
    "priceBox": [
      28,
      69.3,
      20,
      5.7
    ]
  },
  "dog-social": {
    "id": "dog-social",
    "species": "dog",
    "kind": "social",
    "title": "遛弯遇见新朋友",
    "cost": 0,
    "hours": 3,
    "energy": -2,
    "happiness": 4,
    "stress": -2,
    "medical": false,
    "button": "一起聊聊",
    "art": "assets/pets/events/dog-social-20261106.webp",
    "buttonBox": [
      14,
      91.4,
      72,
      7
    ]
  },
  "dog-surprise": {
    "id": "dog-surprise",
    "species": "dog",
    "kind": "surprise",
    "title": "它把宝贝送给你",
    "cost": 0,
    "hours": 0,
    "energy": 0,
    "happiness": 3,
    "stress": -2,
    "medical": false,
    "button": "收下这份心意",
    "art": "assets/pets/events/dog-surprise-20261106.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "dog-accident": {
    "id": "dog-accident",
    "species": "dog",
    "kind": "accident",
    "title": "淘气的小意外",
    "cost": 50,
    "hours": 1,
    "energy": -1,
    "stress": 1,
    "medical": false,
    "button": "收拾一下，换个新的",
    "art": "assets/pets/events/dog-accident-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ]
  },
  "cat-companion": {
    "id": "cat-companion",
    "species": "cat",
    "kind": "companion",
    "title": "撸猫日常",
    "energy": 3,
    "happiness": 3,
    "stress": -2,
    "cost": 0,
    "hours": 1,
    "medical": false,
    "button": "陪它待一会儿",
    "art": "assets/pets/events/companion-cat-20261105.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "cat-unwell": {
    "id": "cat-unwell",
    "species": "cat",
    "kind": "unwell",
    "title": "猫咪有点不舒服",
    "cost": 200,
    "hours": 3,
    "energy": -2,
    "stress": 2,
    "medical": true,
    "button": "带它去看医生",
    "art": "assets/pets/events/cat-unwell-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ],
    "priceBox": [
      28,
      69.3,
      20,
      5.7
    ]
  },
  "cat-social": {
    "id": "cat-social",
    "species": "cat",
    "kind": "social",
    "title": "一聊猫咪就投缘",
    "cost": 0,
    "hours": 3,
    "energy": -2,
    "happiness": 4,
    "stress": -2,
    "medical": false,
    "button": "一起聊聊",
    "art": "assets/pets/events/cat-social-20261106.webp",
    "buttonBox": [
      14,
      91.4,
      72,
      7
    ]
  },
  "cat-surprise": {
    "id": "cat-surprise",
    "species": "cat",
    "kind": "surprise",
    "title": "它悄悄靠了过来",
    "cost": 0,
    "hours": 0,
    "energy": 0,
    "happiness": 2,
    "stress": -3,
    "medical": false,
    "button": "心里一下柔软了",
    "art": "assets/pets/events/cat-surprise-20261106.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "cat-accident": {
    "id": "cat-accident",
    "species": "cat",
    "kind": "accident",
    "title": "玩耍时意外受伤",
    "cost": 500,
    "hours": 4,
    "energy": -3,
    "stress": 3,
    "medical": true,
    "button": "带它去处理伤口",
    "art": "assets/pets/events/cat-accident-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ],
    "priceBox": [
      25.5,
      68.4,
      20.7,
      5.5
    ]
  },
  "crocodile-companion": {
    "id": "crocodile-companion",
    "species": "crocodile",
    "kind": "companion",
    "title": "安静的观察时光",
    "energy": 1,
    "happiness": 4,
    "stress": -2,
    "cost": 0,
    "hours": 1,
    "medical": false,
    "button": "静静观察一会儿",
    "art": "assets/pets/events/companion-crocodile-20261105.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "crocodile-unwell": {
    "id": "crocodile-unwell",
    "species": "crocodile",
    "kind": "unwell",
    "title": "小鳄今天没胃口",
    "cost": 600,
    "hours": 3,
    "energy": -2,
    "stress": 2,
    "medical": true,
    "button": "带它去看医生",
    "art": "assets/pets/events/crocodile-unwell-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ],
    "priceBox": [
      28,
      69.3,
      20,
      5.7
    ]
  },
  "crocodile-social": {
    "id": "crocodile-social",
    "species": "crocodile",
    "kind": "social",
    "title": "养鳄也有同好",
    "cost": 0,
    "hours": 3,
    "energy": -2,
    "happiness": 4,
    "stress": -2,
    "medical": false,
    "button": "一起聊聊",
    "art": "assets/pets/events/crocodile-social-20261106.webp",
    "buttonBox": [
      14,
      91.4,
      72,
      7
    ]
  },
  "crocodile-surprise": {
    "id": "crocodile-surprise",
    "species": "crocodile",
    "kind": "surprise",
    "title": "水面上的小惊喜",
    "cost": 0,
    "hours": 0,
    "energy": 0,
    "happiness": 4,
    "stress": -1,
    "medical": false,
    "button": "记住这个小瞬间",
    "art": "assets/pets/events/crocodile-surprise-20261106.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "crocodile-accident": {
    "id": "crocodile-accident",
    "species": "crocodile",
    "kind": "accident",
    "title": "过滤管漏水了",
    "cost": 50,
    "hours": 1,
    "energy": -1,
    "stress": 1,
    "medical": false,
    "button": "换好接头，擦干地面",
    "art": "assets/pets/events/crocodile-accident-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ]
  },
  "gecko-companion": {
    "id": "gecko-companion",
    "species": "gecko",
    "kind": "companion",
    "title": "傍晚的小探险",
    "energy": 1,
    "happiness": 3,
    "stress": -3,
    "cost": 0,
    "hours": 1,
    "medical": false,
    "button": "看看它的小探险",
    "art": "assets/pets/events/companion-gecko-20261105.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "gecko-unwell": {
    "id": "gecko-unwell",
    "species": "gecko",
    "kind": "unwell",
    "title": "小守宫提不起劲",
    "cost": 120,
    "hours": 3,
    "energy": -2,
    "stress": 2,
    "medical": true,
    "button": "带它去看医生",
    "art": "assets/pets/events/gecko-unwell-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ],
    "priceBox": [
      28,
      69.3,
      20,
      5.7
    ]
  },
  "gecko-social": {
    "id": "gecko-social",
    "species": "gecko",
    "kind": "social",
    "title": "遇见守宫同好",
    "cost": 0,
    "hours": 3,
    "energy": -2,
    "happiness": 4,
    "stress": -2,
    "medical": false,
    "button": "一起聊聊",
    "art": "assets/pets/events/gecko-social-20261106.webp",
    "buttonBox": [
      14,
      91.4,
      72,
      7
    ]
  },
  "gecko-surprise": {
    "id": "gecko-surprise",
    "species": "gecko",
    "kind": "surprise",
    "title": "小守宫睡得正香",
    "cost": 0,
    "hours": 0,
    "energy": 0,
    "happiness": 2,
    "stress": -2,
    "medical": false,
    "button": "被这小睡脸暖到了",
    "art": "assets/pets/events/gecko-surprise-20261106.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "gecko-accident": {
    "id": "gecko-accident",
    "species": "gecko",
    "kind": "accident",
    "title": "躲避屋裂了",
    "cost": 50,
    "hours": 1,
    "energy": -1,
    "stress": 1,
    "medical": false,
    "button": "换个新的躲避屋",
    "art": "assets/pets/events/gecko-accident-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ]
  },
  "spider-companion": {
    "id": "spider-companion",
    "species": "spider",
    "kind": "companion",
    "title": "蛛网小世界",
    "energy": 1,
    "happiness": 1,
    "stress": -5,
    "cost": 0,
    "hours": 1,
    "medical": false,
    "button": "静静观察一会儿",
    "art": "assets/pets/events/companion-spider-20261105.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "spider-unwell": {
    "id": "spider-unwell",
    "species": "spider",
    "kind": "unwell",
    "title": "小蛛今天不对劲",
    "cost": 120,
    "printedCost": 80,
    "hours": 3,
    "energy": -2,
    "stress": 2,
    "medical": true,
    "button": "带它去看医生",
    "art": "assets/pets/events/spider-unwell-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ],
    "priceBox": [
      28,
      69.3,
      20,
      5.7
    ]
  },
  "spider-social": {
    "id": "spider-social",
    "species": "spider",
    "kind": "social",
    "title": "小众爱好遇知音",
    "cost": 0,
    "hours": 3,
    "energy": -2,
    "happiness": 4,
    "stress": -2,
    "medical": false,
    "button": "一起聊聊",
    "art": "assets/pets/events/spider-social-20261106.webp",
    "buttonBox": [
      14,
      91.4,
      72,
      7
    ]
  },
  "spider-surprise": {
    "id": "spider-surprise",
    "species": "spider",
    "kind": "surprise",
    "title": "一夜织出的小惊喜",
    "cost": 0,
    "hours": 0,
    "energy": 0,
    "happiness": 1,
    "stress": -4,
    "medical": false,
    "button": "发现了它的小杰作",
    "art": "assets/pets/events/spider-surprise-20261106.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "spider-accident": {
    "id": "spider-accident",
    "species": "spider",
    "kind": "accident",
    "title": "箱盖合不严了",
    "cost": 50,
    "hours": 1,
    "energy": -1,
    "stress": 1,
    "medical": false,
    "button": "换好箱子，扣紧盖子",
    "art": "assets/pets/events/spider-accident-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ]
  },
  "tortoise-companion": {
    "id": "tortoise-companion",
    "species": "tortoise",
    "kind": "companion",
    "title": "慢慢陪着你",
    "energy": 3,
    "happiness": 3,
    "stress": -2,
    "cost": 0,
    "hours": 1,
    "medical": false,
    "button": "陪它待一会儿",
    "art": "assets/pets/events/companion-tortoise-20261105.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "tortoise-unwell": {
    "id": "tortoise-unwell",
    "species": "tortoise",
    "kind": "unwell",
    "title": "小龟今天没精神",
    "cost": 180,
    "hours": 3,
    "energy": -2,
    "stress": 2,
    "medical": true,
    "button": "带它去看医生",
    "art": "assets/pets/events/tortoise-unwell-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ],
    "priceBox": [
      28,
      69.3,
      20,
      5.7
    ]
  },
  "tortoise-social": {
    "id": "tortoise-social",
    "species": "tortoise",
    "kind": "social",
    "title": "慢慢聊成了朋友",
    "cost": 0,
    "hours": 3,
    "energy": -2,
    "happiness": 4,
    "stress": -2,
    "medical": false,
    "button": "一起聊聊",
    "art": "assets/pets/events/tortoise-social-20261106.webp",
    "buttonBox": [
      14,
      91.4,
      72,
      7
    ]
  },
  "tortoise-surprise": {
    "id": "tortoise-surprise",
    "species": "tortoise",
    "kind": "surprise",
    "title": "慢慢走向你",
    "cost": 0,
    "hours": 0,
    "energy": 0,
    "happiness": 1,
    "stress": -3,
    "medical": false,
    "button": "被这份回应暖到了",
    "art": "assets/pets/events/tortoise-surprise-20261106.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "tortoise-accident": {
    "id": "tortoise-accident",
    "species": "tortoise",
    "kind": "accident",
    "title": "小龟撞翻了花盆",
    "cost": 50,
    "hours": 1,
    "energy": -1,
    "stress": 1,
    "medical": false,
    "button": "收拾一下，换个花盆",
    "art": "assets/pets/events/tortoise-accident-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ]
  },
  "chameleon-companion": {
    "id": "chameleon-companion",
    "species": "chameleon",
    "kind": "companion",
    "title": "枝头的小伙伴",
    "energy": 1,
    "happiness": 2,
    "stress": -4,
    "cost": 0,
    "hours": 1,
    "medical": false,
    "button": "静静陪它一会儿",
    "art": "assets/pets/events/companion-chameleon-20261105.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "chameleon-unwell": {
    "id": "chameleon-unwell",
    "species": "chameleon",
    "kind": "unwell",
    "title": "枝头的小伙伴蔫了",
    "cost": 200,
    "hours": 3,
    "energy": -2,
    "stress": 2,
    "medical": true,
    "button": "带它去看医生",
    "art": "assets/pets/events/chameleon-unwell-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ],
    "priceBox": [
      28,
      69.3,
      20,
      5.7
    ]
  },
  "chameleon-social": {
    "id": "chameleon-social",
    "species": "chameleon",
    "kind": "social",
    "title": "枝头结下的缘分",
    "cost": 0,
    "hours": 3,
    "energy": -2,
    "happiness": 4,
    "stress": -2,
    "medical": false,
    "button": "一起聊聊",
    "art": "assets/pets/events/chameleon-social-20261106.webp",
    "buttonBox": [
      14,
      91.4,
      72,
      7
    ]
  },
  "chameleon-surprise": {
    "id": "chameleon-surprise",
    "species": "chameleon",
    "kind": "surprise",
    "title": "叶间的一抹新色",
    "cost": 0,
    "hours": 0,
    "energy": 0,
    "happiness": 3,
    "stress": -1,
    "medical": false,
    "button": "记住这抹小惊喜",
    "art": "assets/pets/events/chameleon-surprise-20261106.webp",
    "buttonBox": [
      15,
      90,
      70,
      8
    ]
  },
  "chameleon-accident": {
    "id": "chameleon-accident",
    "species": "chameleon",
    "kind": "accident",
    "title": "栖枝松动了",
    "cost": 50,
    "hours": 1,
    "energy": -1,
    "stress": 1,
    "medical": false,
    "button": "换好栖枝，重新固定",
    "art": "assets/pets/events/chameleon-accident-20261106.webp",
    "buttonBox": [
      5,
      89,
      90,
      8
    ]
  }
};root.PetEventCards=cards;if(typeof module!=='undefined')module.exports=cards;})(typeof window!=='undefined'?window:globalThis);
