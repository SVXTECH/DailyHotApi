const Router = require("koa-router");
const guardianRouter = new Router();
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

// 缓存键名
const cacheKey = "guardianData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://content.guardianapis.com/search?&show-fields=headline&api-key=1332b9c7-d878-4244-820e-46d796d34496";

// 数据处理
const getData = (data) => {
  if (!data) return [];
  return data.map((v) => {
    return {
      id: v.id,
      title: v.webTitle,
      url: v.webUrl,
      mobileUrl: v.webUrl,
    };
  });
};

// 哔哩哔哩热门榜
guardianRouter.get("/guardian", async (ctx) => {
  console.log("Get The Guardian Headline");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      // 如果缓存中不存在数据
      console.log("从服务端重新获取 The Guardian Headline");
      // 从服务器拉取数据
      const response = await axios.get(url);
      data = getData(response.data.response.results);
      updateTime = new Date().toISOString();
      // 将数据写入缓存
      await set(cacheKey, data);
    }
    ctx.body = {
      code: 200,
      message: "Get Success",
      title: "The Guardian",
      subtitle: "Headline",
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      title: "The Guardian",
      subtitle: "Headline",
      message: "The Guardian Headline Get Failed",
    };
  }
});

// 获取最新数据
guardianRouter.get("/guardian/new", async (ctx) => {
  console.log("Get The Guardian - 最新数据");
  try {
    // 从服务器拉取最新数据
    const response = await axios.get(url);
    const newData = getData(response.data.response.results);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取 The Guardian Headline");

    // 返回最新数据
    ctx.body = {
      code: 200,
      message: "Get Success",
      title: "The Guardian",
      subtitle: "Headline",
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
        title: "The Guardian",
        subtitle: "Headline",
        total: cachedData.length,
        updateTime,
        data: cachedData,
      };
    } else {
      // 如果缓存中也没有数据，则返回错误信息
      ctx.body = {
        code: 500,
        title: "The Guardian",
        subtitle: "Headline",
        message: "Get Failed",
      };
    }
  }
});

module.exports = guardianRouter;
