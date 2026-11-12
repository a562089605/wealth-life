// Confirmed card data. No natural draw, probability or replacement map category.
(function(root){const data={
  "cards": [
    {
      "id": "manager-care",
      "title": "经理关心近况",
      "role": "经理",
      "minIntimacy": 15,
      "art": "assets/relationships/cards/manager-01-care.webp",
      "options": [
        {
          "label": "聊聊最近的压力",
          "hours": 1,
          "energy": 0,
          "intimacy": 3,
          "happiness": 0,
          "stress": -3,
          "cash": 0
        },
        {
          "label": "谢谢关心",
          "hours": 0,
          "energy": 1,
          "intimacy": 0,
          "happiness": 0,
          "stress": -1,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "manager-experience",
      "title": "经理分享工作经验",
      "role": "经理",
      "minIntimacy": 30,
      "art": "assets/relationships/cards/manager-02-experience.webp",
      "options": [
        {
          "label": "和同事一起听",
          "hours": 1,
          "energy": 0,
          "intimacy": 4,
          "happiness": 2,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "肚子饿了，先去吃饭",
          "hours": 0,
          "energy": 2,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "manager-tasting",
      "title": "经理邀你试新品",
      "role": "经理",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/manager-03-tasting.webp",
      "options": [
        {
          "label": "留下来试喝，聊聊建议",
          "hours": 1,
          "energy": 0,
          "intimacy": 3,
          "happiness": 2,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "家里有事，要先走啦",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "coffeeOnly": true,
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "manager-bonus",
      "title": "认可你的努力",
      "role": "经理",
      "minIntimacy": 30,
      "art": "assets/relationships/cards/manager-04-bonus.webp",
      "options": [
        {
          "label": "谢谢认可，继续加油",
          "hours": 0,
          "energy": 0,
          "intimacy": 2,
          "happiness": 4,
          "stress": 0,
          "cash": 50
        }
      ],
      "boxes": [
        [
          3,
          64,
          94,
          32
        ]
      ]
    },
    {
      "id": "manager-ride",
      "title": "经理顺路送你一程",
      "role": "经理",
      "minIntimacy": 80,
      "art": "assets/relationships/cards/manager-05-ride.webp",
      "options": [
        {
          "label": "太好了，谢谢你！",
          "hours": 0,
          "energy": 3,
          "intimacy": 0,
          "happiness": 0,
          "stress": -3,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          64,
          94,
          32
        ]
      ]
    },
    {
      "id": "coworker-chat",
      "title": "下班后聊聊",
      "role": "同事",
      "minIntimacy": 15,
      "art": "assets/relationships/cards/coworker-01-after-work.webp",
      "options": [
        {
          "label": "留下来聊一会儿",
          "hours": 1,
          "energy": 0,
          "intimacy": 3,
          "happiness": 0,
          "stress": -3,
          "cash": 0
        },
        {
          "label": "今天先走啦，下次聊",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "coworker-snack",
      "title": "分享小点心",
      "role": "同事",
      "minIntimacy": 15,
      "art": "assets/relationships/cards/coworker-02-snack.webp",
      "options": [
        {
          "label": "谢谢，一起尝尝",
          "hours": 0,
          "energy": 2,
          "intimacy": 2,
          "happiness": 3,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          64,
          94,
          32
        ]
      ]
    },
    {
      "id": "coworker-bookshelf",
      "title": "同事请你帮忙搬东西",
      "role": "同事",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/coworker-03-bookshelf.webp",
      "options": [
        {
          "label": "留下来帮忙",
          "hours": 1,
          "energy": -2,
          "intimacy": 5,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "今天不方便，下次吧",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "coworker-order",
      "title": "同事约你拼单",
      "role": "同事",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/coworker-04-order.webp",
      "options": [
        {
          "label": "一起点一份",
          "hours": 0,
          "energy": 2,
          "intimacy": 2,
          "happiness": 3,
          "stress": 0,
          "cash": -15
        },
        {
          "label": "今天不买，谢谢啦",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "coworker-job",
      "title": "同事介绍小兼职",
      "role": "同事",
      "minIntimacy": 80,
      "art": "assets/relationships/cards/coworker-05-side-job.webp",
      "options": [
        {
          "label": "接下来，认真完成",
          "hours": 2,
          "energy": -3,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 100
        },
        {
          "label": "最近没空，谢谢你想着我",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "landlord-chat",
      "title": "和房东聊聊近况",
      "role": "房东",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/landlord-01-chat.webp",
      "options": [
        {
          "label": "停下来聊一会儿",
          "hours": 1,
          "energy": 0,
          "intimacy": 3,
          "happiness": 0,
          "stress": -2,
          "cash": 0
        },
        {
          "label": "住得挺好，谢谢关心",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 1,
          "stress": 0,
          "cash": 0
        }
      ],
      "currentLandlord": true,
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "landlord-beef",
      "title": "房东分享牛腩",
      "role": "房东",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/landlord-02-beef.webp",
      "options": [
        {
          "label": "谢谢，闻着就好香！",
          "hours": 0,
          "energy": 2,
          "intimacy": 2,
          "happiness": 3,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          64,
          94,
          32
        ]
      ]
    },
    {
      "id": "landlord-plants",
      "title": "帮房东照看绿植",
      "role": "房东",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/landlord-03-plants.webp",
      "options": [
        {
          "label": "没问题，我来照看",
          "hours": 1,
          "energy": -1,
          "intimacy": 4,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "最近不太方便，抱歉啦",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "currentLandlord": true,
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "landlord-aircon",
      "title": "深夜空调坏了",
      "role": "房东",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/landlord-04-aircon-main.webp",
      "options": [
        {
          "label": "联系房东",
          "hours": 1,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 1,
          "cash": 0,
          "followup": "aircon"
        },
        {
          "label": "开窗通风，先熬一晚",
          "hours": 0,
          "energy": -2,
          "intimacy": 0,
          "happiness": -2,
          "stress": 2,
          "cash": 0
        }
      ],
      "currentLandlord": true,
      "aircon": true,
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "classmate-library",
      "title": "同学约你去图书馆",
      "role": "同学",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/classmate-01-library.webp",
      "options": [
        {
          "label": "好呀，一起去",
          "hours": 1,
          "energy": 0,
          "intimacy": 3,
          "happiness": 0,
          "stress": -3,
          "cash": 0,
          "followup": "classmate"
        },
        {
          "label": "今天先不去了",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "classmate-notes",
      "title": "向同学借笔记",
      "role": "同学",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/classmate-02-borrow-notes.webp",
      "options": [
        {
          "label": "谢谢，帮大忙了！",
          "hours": 0,
          "energy": 0,
          "intimacy": 2,
          "happiness": 0,
          "stress": -2,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          64,
          94,
          32
        ]
      ]
    },
    {
      "id": "classmate-presentation",
      "title": "一起准备课堂展示",
      "role": "同学",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/classmate-03-presentation.webp",
      "options": [
        {
          "label": "好呀，我帮你看看",
          "hours": 1,
          "energy": -1,
          "intimacy": 4,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "这次可能帮不上忙",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "classmate-snack",
      "title": "下课后一起吃点东西",
      "role": "同学",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/classmate-04-after-class-snack.webp",
      "options": [
        {
          "label": "好呀，一起去",
          "hours": 0,
          "energy": 2,
          "intimacy": 2,
          "happiness": 2,
          "stress": 0,
          "cash": -15
        },
        {
          "label": "我先回去啦",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "classmate-plan",
      "title": "同学帮你梳理学习计划",
      "role": "同学",
      "minIntimacy": 80,
      "art": "assets/relationships/cards/classmate-05-study-plan-choice-layout.webp",
      "options": [
        {
          "label": "谢谢，这下有方向了！",
          "hours": 3,
          "energy": 2,
          "intimacy": 3,
          "happiness": 2,
          "stress": -3,
          "cash": 0,
          "studyMonths": 1
        },
        {
          "label": "暂时不用，谢谢你",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          54,
          94,
          31
        ],
        [
          3,
          87,
          94,
          10
        ]
      ]
    },
    {
      "id": "petfriend-chat",
      "title": "聊聊养宠日常",
      "role": "宠友",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/petfriend-01-chat.webp",
      "options": [
        {
          "label": "一起聊聊养宠趣事",
          "hours": 1,
          "energy": 0,
          "intimacy": 3,
          "happiness": 0,
          "stress": -3,
          "cash": 0
        },
        {
          "label": "简单聊上几句",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "petfriend-organizer",
      "title": "宠友送你收纳袋",
      "role": "宠友",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/petfriend-02-organizer.webp",
      "options": [
        {
          "label": "正好用得上，谢谢！",
          "hours": 0,
          "energy": 0,
          "intimacy": 2,
          "happiness": 3,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          64,
          94,
          32
        ]
      ]
    },
    {
      "id": "petfriend-shop",
      "title": "宠友约你逛用品店",
      "role": "宠友",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/petfriend-03-shop.webp",
      "options": [
        {
          "label": "走，一起看看",
          "hours": 1,
          "energy": 0,
          "intimacy": 3,
          "happiness": 2,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "你慢慢逛，我先走啦",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    },
    {
      "id": "petfriend-late",
      "title": "宠友赴约迟到了",
      "role": "宠友",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/petfriend-04-late-arrival.webp",
      "options": [
        {
          "label": "把自己的感受说清楚",
          "hours": 1,
          "energy": 0,
          "intimacy": 3,
          "happiness": 0,
          "stress": -1,
          "cash": 0
        },
        {
          "label": "算啦，先不提了",
          "hours": 0,
          "energy": 0,
          "intimacy": 3,
          "happiness": 0,
          "stress": 1,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          58,
          94,
          21
        ],
        [
          3,
          80,
          94,
          18
        ]
      ]
    },
    {
      "id": "petfriend-job",
      "title": "宠友介绍咖啡店兼职",
      "role": "宠友",
      "minIntimacy": 80,
      "art": "assets/relationships/cards/petfriend-05-cafe-day-job.webp",
      "options": [
        {
          "label": "好呀，我去帮一天",
          "hours": 8,
          "energy": -8,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 300
        },
        {
          "label": "最近没空，谢谢你想着我",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          59,
          94,
          26
        ],
        [
          3,
          86,
          94,
          12
        ]
      ]
    }
  ],
  "followups": {
    "classmate": {
      "title": "认识新同学",
      "art": "assets/relationships/cards/classmate-01-library-new-contact.webp",
      "options": [
        {
          "label": "你好，很高兴认识你！",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        }
      ],
      "boxes": [
        [
          6,
          86,
          88,
          11
        ]
      ]
    },
    "success": {
      "title": "房东送来备用风扇",
      "art": "assets/relationships/cards/landlord-04-aircon-success.webp",
      "options": [
        {
          "label": "太好了，谢谢！",
          "hours": 0,
          "energy": 1,
          "intimacy": 0,
          "happiness": 2,
          "stress": -2,
          "cash": 0
        }
      ],
      "boxes": [
        [
          12,
          70,
          76,
          8
        ]
      ]
    },
    "failure": {
      "title": "没能联系上房东",
      "art": "assets/relationships/cards/landlord-04-aircon-failure.webp",
      "options": [
        {
          "label": "先熬过今晚吧",
          "hours": 0,
          "energy": -2,
          "intimacy": 0,
          "happiness": -2,
          "stress": 1,
          "cash": 0
        }
      ],
      "boxes": [
        [
          6,
          86,
          88,
          11
        ]
      ]
    }
  }
};root.RelationshipCardData=data;if(typeof module!=="undefined")module.exports=data;})(typeof window==="undefined"?globalThis:window);
