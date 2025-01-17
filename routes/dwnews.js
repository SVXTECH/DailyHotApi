const Router = require("koa-router");
const dwnewsRouter = new Router();
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

// 缓存键名
const cacheKey = "dwnewsData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://newsdata.io/api/1/news?apikey=pub_246381062ddd3e21a9fbfb8de41a84247c66e&domain=dw";

// 数据处理
const getData = (data) => {
  if (!data) return [];
  return data.map((v) => {
    return {
      title: v.title,
      desc: v.description,
      url: v.link,
      mobileUrl: v.link,
    };
  });
};

// DW Schlagzeilen
dwnewsRouter.get("/dwnews", async (ctx) => {
  console.log("Get DW Schlagzeilen");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      // 如果缓存中不存在数据
      console.log("Retrieve DW Schlagzeilen From The Server");
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
      title: "Deutsche Welle",
      subtitle: "Schlagzeilen",
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      title: "Deutsche Welle",
      subtitle: "Schlagzeilen",
      message: "DW Schlagzeilen Get Failed",
    };
  }
});

// 获取最新数据
dwnewsRouter.get("/dwnews/new", async (ctx) => {
  console.log("Get Deutsche Welle - Latest Data");
  try {
    // 从服务器拉取最新数据
    const response = await axios.get(url);
    const newData = getData(response.data.results);
    updateTime = new Date().toISOString();
    console.log("Retrieve DW Schlagzeilen From The Server");

    // 返回最新数据
    ctx.body = {
      code: 200,
      message: "Get Success",
      title: "Deutsche Welle",
      subtitle: "Schlagzeilen",
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
        title: "Deutsche Welle",
        subtitle: "Schlagzeilen",
        total: cachedData.length,
        updateTime,
        data: cachedData,
      };
    } else {
      // 如果缓存中也没有数据，则返回错误信息
      ctx.body = {
        code: 500,
        title: "Deutsche Welle",
        subtitle: "Schlagzeilen",
        message: "Get Failed",
      };
    }
  }
});

module.exports = dwnewsRouter;