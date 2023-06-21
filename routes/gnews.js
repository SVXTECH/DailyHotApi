const Router = require("koa-router");
const gnewsRouter = new Router();
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

// 缓存键名
const cacheKey = "gnewsData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://gnews.io/api/v4/top-headlines?category=general&max=30&apikey=d5bc5352b12bc87c86073fca77300b5c";

// 数据处理
const getData = (data) => {
  if (!data) return [];
  return data.map((v) => {
    return {
      title: v.title,
      desc: v.description,
      url: v.url,
      mobileUrl: v.url,
    };
  });
};

// 哔哩哔哩热门榜
gnewsRouter.get("/gnews", async (ctx) => {
  console.log("Get Google News Top Headlines");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      // 如果缓存中不存在数据
      console.log("Retrieve Google News Top Headlines From The Server");
      // 从服务器拉取数据
      const response = await axios.get(url);
      data = getData(response.data.articles);
      updateTime = new Date().toISOString();
      // 将数据写入缓存
      await set(cacheKey, data);
    }
    ctx.body = {
      code: 200,
      message: "Get Success",
      title: "Google News",
      subtitle: "Top Headlines",
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      title: "Google News",
      subtitle: "Top Headlines",
      message: "Google News Top Headlines Get Failed",
    };
  }
});

// 获取最新数据
gnewsRouter.get("/gnews/new", async (ctx) => {
  console.log("Get Google News - Latest Data");
  try {
    // 从服务器拉取最新数据
    const response = await axios.get(url);
    const newData = getData(response.data.articles);
    updateTime = new Date().toISOString();
    console.log("Retrieve Google News Top Headlines from the server");

    // 返回最新数据
    ctx.body = {
      code: 200,
      message: "Get Success",
      title: "Google News",
      subtitle: "Top Headlines",
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
        title: "Google News",
        subtitle: "Top Headlines",
        total: cachedData.length,
        updateTime,
        data: cachedData,
      };
    } else {
      // 如果缓存中也没有数据，则返回错误信息
      ctx.body = {
        code: 500,
        title: "Google News",
        subtitle: "Top Headlines",
        message: "Get Failed",
      };
    }
  }
});

module.exports = gnewsRouter;