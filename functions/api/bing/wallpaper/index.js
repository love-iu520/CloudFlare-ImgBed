export async function onRequest(context) {
    // Contents of context object
    const {
      request, // same as existing Worker API
      env, // same as existing Worker API
      params, // if filename includes [id] or [[path]]
      waitUntil, // same as ctx.waitUntil in existing Worker API
      next, // used for middleware or to fetch assets
      data, // arbitrary space for passing data between middlewares
    } = context;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch('https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=5', {
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Bing wallpaper request failed with status ${res.status}`);
      }

      const bingData = await res.json();
      const returnData = {
        status: true,
        message: '操作成功',
        data: Array.isArray(bingData.images) ? bingData.images : [],
      };

      return new Response(JSON.stringify(returnData), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: false,
        message: 'Bing wallpaper is temporarily unavailable',
        data: [],
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

  }
