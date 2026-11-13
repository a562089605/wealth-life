// Confirmed relationship review 2026-11-13; natural selector remains disabled.
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
      "art": "assets/relationships/cards/manager-experience-20261113.webp",
      "options": [
        {
          "label": "和同事一起听",
          "hours": 1,
          "energy": 0,
          "intimacy": 4,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "肚子饿了，先去吃饭",
          "hours": 0,
          "energy": 2,
          "intimacy": 0,
          "happiness": 0,
          "stress": -1,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          52,
          94,
          20
        ],
        [
          3,
          73,
          94,
          24
        ]
      ]
    },
    {
      "id": "manager-tasting",
      "title": "经理邀你试新品",
      "role": "经理",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/manager-tasting-20261113.webp",
      "options": [
        {
          "label": "留下来试喝，聊聊建议",
          "hours": 1,
          "energy": -1,
          "intimacy": 3,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "家里有事，要先走啦",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 2,
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
          23
        ],
        [
          3,
          83,
          94,
          16
        ]
      ]
    },
    {
      "id": "manager-bonus",
      "title": "认可你的努力",
      "role": "经理",
      "minIntimacy": 30,
      "art": "assets/relationships/cards/manager-bonus-20261113.webp",
      "options": [
        {
          "label": "谢谢认可，继续加油",
          "hours": 0,
          "energy": 2,
          "intimacy": 2,
          "happiness": 4,
          "stress": -2,
          "cash": 50
        }
      ],
      "boxes": [
        [
          3,
          89,
          94,
          10
        ]
      ],
      "incomeKind": "bonus"
    },
    {
      "id": "manager-pickup",
      "title": "帮店里取货",
      "role": "经理",
      "minIntimacy": 0,
      "coffeeOnly": true,
      "strictResources": true,
      "payMode": "pickup",
      "options": [
        {
          "label": "好，我去取回来。",
          "hours": 2,
          "energy": -4,
          "intimacy": 4,
          "happiness": 0,
          "stress": 0,
          "cash": 46
        },
        {
          "label": "今天不方便，抱歉。",
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
          53,
          94,
          32
        ],
        [
          3,
          87,
          94,
          9
        ]
      ],
      "art": "assets/relationships/cards/manager-pickup-20261113.webp"
    },
    {
      "id": "manager-extra-shifts",
      "title": "经理请你多排几天班",
      "role": "经理",
      "minIntimacy": 80,
      "coffeeOnly": true,
      "strictResources": true,
      "payMode": "shifts",
      "options": [
        {
          "label": "好，我来帮忙。",
          "hours": 40,
          "energy": -15,
          "intimacy": 5,
          "happiness": 0,
          "stress": 8,
          "cash": 1007.86
        },
        {
          "label": "这个月排不开，抱歉。",
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
          51,
          94,
          38
        ],
        [
          3,
          90,
          94,
          8
        ]
      ],
      "art": "assets/relationships/cards/manager-extra-shifts-20261113.webp"
    },
    {
      "id": "coworker-chat",
      "title": "下班一起尝尝新餐厅",
      "role": "同事",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/coworker-chat-20261113.webp",
      "options": [
        {
          "label": "去！",
          "hours": 1,
          "energy": 3,
          "intimacy": 3,
          "happiness": 0,
          "stress": -3,
          "cash": -25
        },
        {
          "label": "不去啦，下次吧。",
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
          53,
          94,
          32
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
      "minIntimacy": 0,
      "art": "assets/relationships/cards/coworker-snack-20261113.webp",
      "options": [
        {
          "label": "谢谢，一起尝尝",
          "hours": 0,
          "energy": 2,
          "intimacy": 2,
          "happiness": 3,
          "stress": -1,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          85,
          94,
          13
        ]
      ]
    },
    {
      "id": "coworker-bookshelf",
      "title": "帮同事搬家",
      "role": "同事",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/coworker-bookshelf-20261113.webp",
      "options": [
        {
          "label": "没问题，我来帮忙。",
          "hours": 4,
          "energy": -8,
          "intimacy": 6,
          "happiness": 0,
          "stress": 0,
          "cash": 0,
          "followup": "moving-meal"
        },
        {
          "label": "那天不方便，抱歉啦。",
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
          25
        ],
        [
          3,
          85,
          94,
          13
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
      "title": "帮忙布置画展",
      "role": "同事",
      "minIntimacy": 80,
      "art": "assets/relationships/cards/coworker-job-20261113.webp",
      "options": [
        {
          "label": "有空，我去帮忙。",
          "hours": 3,
          "energy": -6,
          "intimacy": 0,
          "happiness": 0,
          "stress": 0,
          "cash": 200
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
          28
        ],
        [
          3,
          89,
          94,
          10
        ]
      ]
    },
    {
      "id": "landlord-chat",
      "title": "和房东聊聊近况",
      "role": "房东",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/landlord-chat-20261113.webp",
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
          "intimacy": 1,
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
          22
        ],
        [
          3,
          82,
          94,
          16
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
      "art": "assets/relationships/cards/landlord-plants-20261113.webp",
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
          "label": "最近太忙啦，不好意思。",
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
          11
        ]
      ]
    },
    {
      "id": "landlord-aircon",
      "title": "深夜空调坏了",
      "role": "房东",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/landlord-aircon-20261113.webp",
      "options": [
        {
          "label": "联系房东",
          "hours": 1,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": 2,
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
          54,
          94,
          20
        ],
        [
          3,
          75,
          94,
          21
        ]
      ]
    },
    {
      "id": "classmate-library",
      "title": "同学约你去图书馆",
      "role": "同学",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/classmate-library-20261113.webp",
      "options": [
        {
          "label": "好呀，一起去",
          "hours": 3,
          "energy": -3,
          "intimacy": 3,
          "happiness": 0,
          "stress": 0,
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
          60,
          94,
          25
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
      "title": "同学向你请教问题",
      "role": "同学",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/classmate-presentation-20261113.webp",
      "options": [
        {
          "label": "好呀，我们一起看看。",
          "hours": 1,
          "energy": -1,
          "intimacy": 4,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "这题我也不太会，不好意思。",
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
          25
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
      "art": "assets/relationships/cards/classmate-snack-20261113.webp",
      "options": [
        {
          "label": "好呀，一起去",
          "hours": 1,
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
          29
        ],
        [
          3,
          89,
          94,
          10
        ]
      ]
    },
    {
      "id": "classmate-plan",
      "title": "同学帮你梳理学习计划",
      "role": "同学",
      "minIntimacy": 80,
      "art": "assets/relationships/cards/classmate-plan-20261113.webp",
      "options": [
        {
          "label": "谢谢，这下有方向了！",
          "hours": 3,
          "energy": 0,
          "intimacy": 3,
          "happiness": 2,
          "stress": -5,
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
          55,
          94,
          30
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
      "art": "assets/relationships/cards/petfriend-chat-20261113.webp",
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
          "intimacy": 1,
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
          25
        ],
        [
          3,
          85,
          94,
          14
        ]
      ]
    },
    {
      "id": "petfriend-organizer",
      "title": "宠友送你护理券",
      "role": "宠友",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/petfriend-organizer-20261113.webp",
      "options": [
        {
          "label": "太贴心了，谢谢你！",
          "hours": 0,
          "energy": 0,
          "intimacy": 2,
          "happiness": 3,
          "stress": 0,
          "cash": 0,
          "careCoupons": 3
        }
      ],
      "boxes": [
        [
          12,
          90,
          76,
          9
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
      "title": "两只宠物起了冲突",
      "role": "宠友",
      "minIntimacy": 0,
      "art": "assets/relationships/cards/petfriend-late-20261113.webp",
      "options": [
        {
          "label": "安抚宠物，和宠友聊聊刚才的事。",
          "hours": 1,
          "energy": -2,
          "intimacy": 3,
          "happiness": 0,
          "stress": 0,
          "cash": 0
        },
        {
          "label": "今天先回家，让彼此缓一缓。",
          "hours": 0,
          "energy": 0,
          "intimacy": 0,
          "happiness": 0,
          "stress": -2,
          "cash": 0
        }
      ],
      "boxes": [
        [
          3,
          56,
          94,
          23
        ],
        [
          3,
          80,
          94,
          18
        ]
      ],
      "contactPets": true
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
      ],
      "incomeKind": "fixedIncludingTips"
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
      "art": "assets/relationships/cards/success-20261113.webp",
      "options": [
        {
          "label": "太好了，谢谢！",
          "hours": 0,
          "energy": 1,
          "intimacy": 0,
          "happiness": 2,
          "stress": 0,
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
      "art": "assets/relationships/cards/failure-20261113.webp",
      "options": [
        {
          "label": "先熬过今晚吧",
          "hours": 0,
          "energy": -2,
          "intimacy": 0,
          "happiness": -2,
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
    "moving-meal": {
      "title": "搬完家，一起吃顿饭",
      "options": [
        {
          "label": "那我就不客气啦！",
          "hours": 0,
          "energy": 4,
          "intimacy": 2,
          "happiness": 3,
          "stress": -2,
          "cash": 0
        }
      ],
      "boxes": [
        [
          12,
          87,
          76,
          10
        ]
      ],
      "art": "assets/relationships/cards/moving-meal-20261113.webp"
    }
  }
};root.RelationshipCardData=data;if(typeof module!=="undefined")module.exports=data;})(typeof window==="undefined"?globalThis:window);
