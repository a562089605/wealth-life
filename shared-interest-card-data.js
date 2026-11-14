// Confirmed shared-interest data. Natural map draw is disabled.
(function(root){
 const data={
  "version": 1,
  "naturalDrawEnabled": false,
  "triggerProbability": null,
  "cards": [
    {
      "id": "tasting-invite",
      "title": "一起品鉴咖啡",
      "scene": "联系人发来消息：“发现一家店有咖啡品鉴活动，你也喜欢这个，要不要一起去？”",
      "file": "design/hobbies-20261113/shared-tasting-invitation-confirmed.png",
      "sha256": "b8525d111654b960bc2d5d6531a387b5eda9c3d2962accc54e1c9df6b05a0a7f",
      "hobby": "tasting",
      "options": [
        {
          "label": "好呀，一起去",
          "effects": {
            "cash": -30,
            "hours": 2,
            "energy": -1,
            "xp": 10,
            "happiness": 4,
            "stress": -4,
            "intimacy": 3
          }
        },
        {
          "label": "这次先不去了",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/tasting-invite.webp"
    },
    {
      "id": "tasting-notes",
      "title": "聊聊最近喝到的咖啡",
      "scene": "对方说：“我最近去了一家咖啡店，咖啡特别好喝！”",
      "file": "design/hobbies-20261113/shared-tasting-conversation-confirmed.png",
      "sha256": "3b07105c3e403ee2b4aca4168170dc1b4d38d89e8e12c69729967deed5ee5195",
      "hobby": "tasting",
      "options": [
        {
          "label": "好啊好啊，快跟我说说！",
          "effects": {
            "hours": 1,
            "xp": 5,
            "happiness": 2,
            "stress": -2,
            "intimacy": 3
          }
        },
        {
          "label": "我这会儿有点事，下次聊呀。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/tasting-notes.webp"
    },
    {
      "id": "tasting-news",
      "title": "分享咖啡新发现",
      "scene": "对方发来一家有趣咖啡店的照片，与你分享新发现。",
      "file": "design/hobbies-20261113/shared-tasting-discovery-confirmed.png",
      "sha256": "313584ed322ac79b34d3795ff1118eecd91213c561568821aed58c44b795cd27",
      "hobby": "tasting",
      "options": [
        {
          "label": "谢谢分享，看着就不错！",
          "effects": {
            "happiness": 2,
            "intimacy": 2
          }
        }
      ],
      "art": "assets/hobbies/events/tasting-news.webp"
    },
    {
      "id": "tasting-queue",
      "title": "一起去探店",
      "scene": "对方发现了一家新开的咖啡店，问你：“就在这家喝，还是换一家看看？”",
      "file": "design/hobbies-20261113/shared-tasting-explore-confirmed.png",
      "sha256": "dc3eea78750dcd8870e3c65e4132ee22832c8115fb350f8af2bbdd5e2f6ff7cf",
      "hobby": "tasting",
      "options": [
        {
          "label": "就在这家喝吧！",
          "effects": {
            "cash": -30,
            "hours": 1,
            "energy": -1,
            "xp": 5,
            "intimacy": 3
          }
        },
        {
          "label": "换一家看看吧。",
          "effects": {
            "hours": 1
          }
        }
      ],
      "followup": {
        "choice": 1,
        "weights": [
          1,
          1,
          1
        ],
        "outcomes": [
          {
            "id": "queue",
            "title": "换了一家，还是要排队",
            "effects": {
              "cash": -30,
              "hours": 1,
              "energy": -1,
              "stress": 1,
              "xp": 5,
              "intimacy": 3
            },
            "file": "design/hobbies-20261113/shared-tasting-explore-queue-followup-confirmed.png",
            "sha256": "5a6b6ff78396c1d6d9d4ee97ec65321cc196a162eac3f543757bd62002213fb1",
            "art": "assets/hobbies/events/tasting-queue-queue.webp",
            "scene": "你们又找了一家店，没想到也要排队。边等边聊，终于喝上了咖啡。",
            "label": "总算喝上啦！"
          },
          {
            "id": "no-queue",
            "title": "这家不用排队",
            "effects": {
              "cash": -30,
              "hours": 1,
              "energy": -1,
              "xp": 5,
              "intimacy": 3
            },
            "file": "design/hobbies-20261113/shared-tasting-explore-no-queue-followup-confirmed.png",
            "sha256": "73f652e6c51e0c684bb3a3817ddf57e149cdb2849d26e25cb8e09214e3cf315f",
            "art": "assets/hobbies/events/tasting-queue-no-queue.webp",
            "scene": "又走了一段路，终于找到一家不用排队的咖啡店。你们坐下来，喝着咖啡聊起了各自喜欢的风味。",
            "label": "这家选得不错！"
          },
          {
            "id": "no-suitable-cafe",
            "title": "没找到合适的店",
            "effects": {
              "hours": 1,
              "energy": -1,
              "stress": 1,
              "intimacy": 1
            },
            "file": "design/hobbies-20261113/shared-tasting-explore-no-suitable-followup-confirmed.png",
            "sha256": "bdb86050e50f8e81b0d2a618118341c3c7076f308ece5a8d61165029f214d2c7",
            "art": "assets/hobbies/events/tasting-queue-no-suitable-cafe.webp",
            "scene": "走了几家，都没找到合适的咖啡店。你们有点累了，便约好下次再来，一起往回走。",
            "label": "下次再一起喝吧。"
          }
        ]
      },
      "art": "assets/hobbies/events/tasting-queue.webp"
    },
    {
      "id": "tasting-compare",
      "title": "一起做风味对比",
      "scene": "对方约你比较几种不同烘焙程度的咖啡，记录各自感受。",
      "file": "design/hobbies-20261113/shared-tasting-compare-confirmed.png",
      "sha256": "3bb48a4989162f96cafb7447de486c7b3ed74e7e80fe89a4336043bb795aaaf9",
      "hobby": "tasting",
      "options": [
        {
          "label": "好呀，一起尝尝！",
          "effects": {
            "cash": -40,
            "hours": 3,
            "energy": -2,
            "xp": 15,
            "happiness": 4,
            "stress": -3,
            "intimacy": 4
          }
        },
        {
          "label": "这次先不去了。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/tasting-compare.webp"
    },
    {
      "id": "baking-invite",
      "title": "一起去学做点心",
      "scene": "对方发来消息：“有家店可以学做饼干，你不是也喜欢烘焙吗？要不要一起去试试？”",
      "file": "design/hobbies-20261113/shared-baking-invite-confirmed.png",
      "sha256": "7cdb8a24456ee3036cf3f0f3fe6d7e93cca828bc9eeb782c3289070201960d97",
      "hobby": "baking",
      "options": [
        {
          "label": "好呀，一起去学学！",
          "effects": {
            "cash": -45,
            "hours": 3,
            "energy": -2,
            "xp": 10,
            "happiness": 4,
            "stress": -4,
            "intimacy": 3
          }
        },
        {
          "label": "这次先不去了。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/baking-invite.webp"
    },
    {
      "id": "baking-decoration",
      "title": "一起装饰饼干",
      "scene": "对方发来消息：“我看到几款特别可爱的糖霜饼干，有点想自己做。你要不要一起？”",
      "file": "design/hobbies-20261113/shared-baking-decoration-confirmed.png",
      "sha256": "c774007b56eb89e42529b26a776630c42e6656e09cf707c55c20a9125cb84226",
      "hobby": "baking",
      "options": [
        {
          "label": "好呀，咱们也试试！",
          "effects": {
            "cash": -25,
            "hours": 2,
            "energy": -1,
            "xp": 5,
            "happiness": 3,
            "stress": -2,
            "intimacy": 3
          }
        },
        {
          "label": "这次先不去了。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/baking-decoration.webp"
    },
    {
      "id": "baking-treat",
      "title": "分享亲手做的点心",
      "scene": "对方带来一盒自己烤的小点心：“这次做得还不错，带了点给你，尝尝？”",
      "file": "design/hobbies-20261113/shared-baking-treat-confirmed.png",
      "sha256": "d8c7dbd38f2c8f1eb7784d1f67c3370add97e3f1b5709635af8cbb360a50d54f",
      "hobby": "baking",
      "options": [
        {
          "label": "谢谢，还惦记着给我留一份！",
          "effects": {
            "happiness": 2,
            "intimacy": 2,
            "energy": 2
          }
        }
      ],
      "art": "assets/hobbies/events/baking-treat.webp"
    },
    {
      "id": "baking-burnt",
      "title": "耳环掉进面糊了",
      "scene": "你们正一起做杯子蛋糕，对方的耳环不小心掉进了面糊。两人赶紧停下来，这下得先找耳环了。",
      "file": "design/hobbies-20261113/shared-baking-earring-confirmed.png",
      "sha256": "2a14abb224ba65055f4764138e164edb0ae0cad861cffef8b6a32240564ca69d",
      "hobby": "baking",
      "options": [
        {
          "label": "别急，找出来后咱们重新做。",
          "effects": {
            "cash": -40,
            "hours": 2,
            "energy": -2,
            "xp": 5,
            "intimacy": 3
          }
        },
        {
          "label": "先把耳环找回来，蛋糕下次再做吧。",
          "effects": {
            "cash": -20,
            "hours": 1,
            "energy": -1,
            "stress": 1,
            "intimacy": 1
          }
        }
      ],
      "art": "assets/hobbies/events/baking-burnt.webp"
    },
    {
      "id": "baking-cake",
      "title": "合作做一个小蛋糕",
      "scene": "对方发来消息：“我想试着做个水果蛋糕，一个人忙不过来。你有空吗？咱们一起做，做好一起吃！”",
      "file": "design/hobbies-20261113/shared-baking-cake-confirmed.png",
      "sha256": "fbcaaec722306ceb7f2effa2e0f5c823eb955ba097ec9f2bada5500097d2103a",
      "hobby": "baking",
      "options": [
        {
          "label": "好呀，咱们分工！",
          "effects": {
            "cash": -55,
            "hours": 4,
            "energy": -3,
            "xp": 15,
            "happiness": 5,
            "stress": -3,
            "intimacy": 4
          }
        },
        {
          "label": "这次先不去了。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/baking-cake.webp"
    },
    {
      "id": "photography-invite",
      "title": "咖啡店的网红小角落",
      "scene": "对方发来消息：“发现一家咖啡店，窗边的光特别好看。要不要一起去坐坐，顺便拍点照片？”",
      "file": "design/hobbies-20261113/shared-photography-invite-confirmed.png",
      "sha256": "d754f50906bc17a66ffe4b1a50b98fa5e97e1c514c25de1f5c1bad5448de92fc",
      "hobby": "photography",
      "options": [
        {
          "label": "好呀，一起去拍拍！",
          "effects": {
            "cash": -20,
            "hours": 2,
            "energy": -1,
            "xp": 10,
            "happiness": 4,
            "stress": -4,
            "intimacy": 3
          }
        },
        {
          "label": "这次先不去了。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/photography-invite.webp"
    },
    {
      "id": "photography-composition",
      "title": "交流构图心得",
      "scene": "对方翻出最近拍的照片：“这几张总觉得差点意思，你帮我看看？我也想看看你最近拍了什么。”",
      "file": "design/hobbies-20261113/shared-photography-composition-confirmed.png",
      "sha256": "5c9b7009f34bda18da8f4c1dd14e731c7ba8676ecf20b9b843b852f62b5a8848",
      "hobby": "photography",
      "options": [
        {
          "label": "交流交流",
          "effects": {
            "hours": 1,
            "energy": -1,
            "xp": 5,
            "stress": -2,
            "intimacy": 3
          }
        },
        {
          "label": "我这会儿有点事，下次聊呀。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/photography-composition.webp"
    },
    {
      "id": "photography-share",
      "title": "收到一组好看的照片",
      "scene": "对方发来几张最近拍的街景：“今天碰到的光特别好看，忍不住拍了几张，发给你看看！”",
      "file": "design/hobbies-20261113/shared-photography-share-confirmed.png",
      "sha256": "0a48c8dc2c8f28012dfc929b626dbb29608b990bf297fcfb5f64bc177db49b19",
      "hobby": "photography",
      "options": [
        {
          "label": "拍得真好，谢谢分享！",
          "effects": {
            "happiness": 2,
            "intimacy": 2
          }
        }
      ],
      "art": "assets/hobbies/events/photography-share.webp"
    },
    {
      "id": "photography-rain",
      "title": "出门采风",
      "scene": "对方发来消息：“本来想约你拍阳光，结果下雨了。不过这会儿雨停了，街上的倒影挺好看，要不要一起去拍？”",
      "file": "design/hobbies-20261113/shared-photography-outing-confirmed.png",
      "sha256": "83abb8262f25115f0c34f3a4663f606d6ab5a3aeafd2e89f8d6e6e7e18808a6c",
      "hobby": "photography",
      "options": [
        {
          "label": "好呀，试试拍倒影！",
          "effects": {
            "hours": 1,
            "energy": -1,
            "xp": 5,
            "happiness": 2,
            "stress": -2,
            "intimacy": 3
          }
        },
        {
          "label": "今天先不去了，下次吧。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/photography-rain.webp"
    },
    {
      "id": "photography-dusk",
      "title": "登山拍日出",
      "scene": "对方发来消息：“听说山顶的日出特别漂亮，要不要一起早点出发，爬上去拍日出？”",
      "file": "design/hobbies-20261113/shared-photography-sunrise-confirmed.png",
      "sha256": "439655b0484333c9608750eb71ab0ba2595ef839454cb105e356bf5409c4cff0",
      "hobby": "photography",
      "options": [
        {
          "label": "走呀，一起去拍日出！",
          "effects": {
            "cash": -15,
            "hours": 3,
            "energy": -2,
            "xp": 15,
            "happiness": 4,
            "stress": -3,
            "intimacy": 4
          }
        },
        {
          "label": "这次先不去了。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/photography-dusk.webp"
    },
    {
      "id": "drawing-invite",
      "title": "把春天画下来",
      "scene": "对方发来消息：“公园里的花开得正好，我想带画本去坐坐。你要不要一起？挑个喜欢的地方画一画。”",
      "file": "design/hobbies-20261113/shared-drawing-spring-confirmed.png",
      "sha256": "4f7e8bac1f927d6661d6473420ee04f7d74b71c9a3db2233bbdb5ae258c7646e",
      "hobby": "drawing",
      "options": [
        {
          "label": "好呀，一起去写生！",
          "effects": {
            "hours": 2,
            "energy": -1,
            "xp": 10,
            "happiness": 4,
            "stress": -4,
            "intimacy": 3
          }
        },
        {
          "label": "这次先不去了。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/drawing-invite.webp"
    },
    {
      "id": "drawing-sketch",
      "title": "这里我看着不太对…",
      "scene": "你们正一起画画，对方把画本递过来：“这里总觉得有点别扭，你觉得怎么改比较好？”",
      "file": "design/hobbies-20261113/shared-drawing-feedback-confirmed.png",
      "sha256": "611f542f512f8d2656fa3dc5049bf7c1796924798f6f2824932ba73b4070fec1",
      "hobby": "drawing",
      "options": [
        {
          "label": "我觉得这里可以这样改……",
          "effects": {
            "hours": 2,
            "energy": -1,
            "xp": 10,
            "happiness": 1,
            "intimacy": 3
          }
        },
        {
          "label": "稍等我一下，我先把这几笔画完。",
          "effects": {
            "hours": 1,
            "energy": -1,
            "xp": 5,
            "intimacy": 1
          }
        }
      ],
      "art": "assets/hobbies/events/drawing-sketch.webp"
    },
    {
      "id": "drawing-card",
      "title": "收到一张手绘小卡",
      "scene": "对方递给你一张小卡：“上次聊到的那个街角，我试着画了下来。送给你，留个纪念！”",
      "file": "design/hobbies-20261113/shared-drawing-card-confirmed.png",
      "sha256": "0a8b1c707f7f0d4ac4f91ae52bcb35708545242407de404fa479019d23551fe5",
      "hobby": "drawing",
      "options": [
        {
          "label": "画得真好，我会好好留着！",
          "effects": {
            "happiness": 3,
            "intimacy": 2
          }
        }
      ],
      "art": "assets/hobbies/events/drawing-card.webp"
    },
    {
      "id": "drawing-colors",
      "title": "一起去画墙绘",
      "scene": "朋友发来消息：“我接了个画墙绘的活，设计和材料都备好了。你来帮我描线、上色，做完分你100美元，怎么样？”",
      "file": "design/hobbies-20261113/shared-drawing-mural-confirmed.png",
      "sha256": "6afa632a12679d4f6abc8bf259c65204873342094b48b0b4975e5e828cfdff7b",
      "hobby": "drawing",
      "options": [
        {
          "label": "好呀，一起去！",
          "effects": {
            "cash": 100,
            "hours": 4,
            "energy": -3,
            "xp": 10,
            "intimacy": 3
          }
        },
        {
          "label": "那天我实在是没空，谢谢。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/drawing-colors.webp"
    },
    {
      "id": "drawing-town",
      "title": "一起去看画展",
      "scene": "朋友发来消息：“镇上有个画展，听说有几幅画挺有意思。你要不要一起去看看？咱们边看边聊。”",
      "file": "design/hobbies-20261113/shared-drawing-exhibition-confirmed.png",
      "sha256": "988d52ab1dcf8dee19a25a7d37af312d601b2bb90ede35ee3da5920b44b9b819",
      "hobby": "drawing",
      "options": [
        {
          "label": "好呀，一起去看看！",
          "effects": {
            "cash": -20,
            "hours": 2,
            "energy": -1,
            "xp": 5,
            "happiness": 3,
            "stress": -2,
            "intimacy": 3
          }
        },
        {
          "label": "这次先不去了。",
          "effects": {}
        }
      ],
      "art": "assets/hobbies/events/drawing-town.webp"
    }
  ]
};
 root.SharedInterestCardData=data;
 if(typeof module!=="undefined")module.exports=data;
})(typeof window==="undefined"?globalThis:window);
