const Router = require("koa-router");
const yonhapRouter = new Router();
const axios = require("axios");
const cheerio = require("cheerio");
const { get, set, del } = require("../utils/cacheData");

// 接口信息
const routerInfo = {
  title: "연합뉴스",
  subtitle: "최신기사",
};

// 缓存键名
const cacheKey = "yonhapData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://www.yna.co.kr/news";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
};

// 数据处理
// const getData = (data) => {
//     if (!data) return [];
//     const dataList = [];
//     try {
//       const pattern =
//         /<script id="js-initialData" type="text\/json">(.*?)<\/script>/;
//       const matchResult = data.match(pattern);
//       const jsonObject = JSON.parse(matchResult[1]).initialState.topstory.hotList;
//       jsonObject.forEach((v) => {
//         dataList.push({
//           title: v.target.titleArea.text,
//           desc: v.target.excerptArea.text,
//           pic: v.target.imageArea.url,
//           hot: parseInt(v.target.metricsArea.text.replace(/[^\d]/g, "")) * 10000,
//           url: v.target.link.url,
//           mobileUrl: v.target.link.url,
//         });
//       });
//       return dataList;
//     } catch (error) {
//       console.error("数据处理出错" + error);
//       return false;
//     }
//   };

  const getData = (data) => {
    const newData = [];
    const regex = /<li>\s*<div class="item-box01">\s*<a href="(.*?)">\s*<figure class="img-con">\s*<span class="img img-cover"><img src="(.*?)" alt="(.*?)"><\/span>\s*<\/figure>\s*<div class="news-con">\s*<div class="tit-wrap">\s*<strong class="tit-news">(.*?)<\/strong>\s*<span class="txt-time">(.*?)<\/span>\s*<\/div>\s*<\/div>\s*<\/a>\s*<\/div>\s*<\/li>/g;
    let match;
  
    while ((match = regex.exec(data)) !== null) {
      const url = match[1];
      const imageUrl = match[2];
      const altText = match[3];
      const title = match[4];
      const time = match[5];
  
      newData.push({
        url,
        imageUrl,
        altText,
        title,
        time,
      });
    }
  
    return newData;
  };

// IT之家热榜
yonhapRouter.get("/yonhap", async (ctx) => {
  console.log("获取IT之家热榜");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      // 如果缓存中不存在数据
      console.log("从服务端重新获取IT之家热榜");
      // 从服务器拉取数据
      const response = await axios.get(url, { headers });
      data = getData(response.data);
      updateTime = new Date().toISOString();
      if (!data) {
        ctx.body = {
          code: 500,
          ...routerInfo,
          message: "获取失败",
        };
        return false;
      }
      // 将数据写入缓存
      await set(cacheKey, data);
    }
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      ...routerInfo,
      message: "获取失败",
    };
  }
});

// IT之家热榜 - 获取最新数据
yonhapRouter.get("/yonhap/new", async (ctx) => {
  console.log("获取IT之家热榜 - 最新数据");
  try {
    // 从服务器拉取最新数据
    const response = await axios.get(url, { headers });
    const newData = getData(response.data);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取IT之家热榜");

    // 返回最新数据
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      updateTime,
      total: data.length,
      data: newData,
    };

    // 删除旧数据
    await del(cacheKey);
    // 将最新数据写入缓存
    await set(cacheKey, newData);
  } catch (error) {
    // 如果拉取最新数据失败，尝试从缓存中获取数据
    console.error(error);
    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        ...routerInfo,
        total: data.length,
        updateTime,
        data: cachedData,
      };
    } else {
      // 如果缓存中也没有数据，则返回错误信息
      ctx.body = {
        code: 500,
        ...routerInfo,
        message: "获取失败",
      };
    }
  }
});

yonhapRouter.info = routerInfo;
module.exports = yonhapRouter;