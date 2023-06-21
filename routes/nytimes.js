const Router = require("koa-router");
const nytimesRouter = new Router();
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

// 缓存键名
const cacheKey = "nytimesData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://api.nytimes.com/svc/topstories/v2/world.json?api-key=dQ9zGkIdWneLw4X4gmMcdlz4H2AYjmU1";

// 数据处理
const getData = (data) => {
  if (!data) return [];
  return data.map((v) => {
    return {
      title: v.title,
      desc: v.abstract,
      owner: v.byline,
      url: v.url,
      mobileUrl: v.url,
    };
  });
};

// The New York Times Top Stories
nytimesRouter.get("/nytimes", async (ctx) => {
  console.log("Get The New York Times Top Stories");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      // 如果缓存中不存在数据
      console.log("从服务端重新获取哔哩哔哩热门榜");
      // 从服务器拉取数据
      const response = await axios.get(url);
      data = getData(response.data.results);
      updateTime = new Date().toISOString();
      // 将数据写入缓存
      await set(cacheKey, data);
    }
    ctx.body = {
      code: 200,
      message: "Get Success",
      title: "The New York Times",
      subtitle: "Top Stories",
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      title: "The New York Times",
      subtitle: "Top Stories",
      message: "哔哩哔哩热门榜获取失败",
    };
  }
});

// 获取最新数据
bilibiliRouter.get("/nytimes/new", async (ctx) => {
  console.log("Get The New York Times - 最新数据");
  try {
    // 从服务器拉取最新数据
    const response = await axios.get(url);
    const newData = getData(response.data.results);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取The New York Times Top Stories");

    // 返回最新数据
    ctx.body = {
      code: 200,
      message: "Get Success",
      title: "The New York Times",
      subtitle: "Top Stories",
      total: newData.length,
      updateTime,
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
        message: "Get Success",
        title: "The New York Times",
        subtitle: "Top Stories",
        total: cachedData.length,
        updateTime,
        data: cachedData,
      };
    } else {
      // 如果缓存中也没有数据，则返回错误信息
      ctx.body = {
        code: 500,
        title: "The New York Times",
        subtitle: "Top Stories",
        message: "Get Failed",
      };
    }
  }
});

module.exports = nytimesRouter;
