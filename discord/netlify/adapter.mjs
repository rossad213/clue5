// Adapt existing Vercel-style API handlers to Netlify's Web Request/Response interface.
// No secrets are exposed to browser code. Preserve HTTP status, JSON and cache headers.
export async function run(handler, request) {
  let body;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const raw = await request.text();
    if (raw) {
      if (raw.length > 100000) return Response.json({error:'Payload too large'}, {status:413});
      try { body = JSON.parse(raw); }
      catch { return Response.json({error:'Invalid JSON body'}, {status:400}); }
    }
  }
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const headers = Object.fromEntries(request.headers.entries());
  const req = {method:request.method,body,query,headers,url:url.pathname};
  const responseHeaders = new Headers();
  let statusCode = 200, completed = false, result;
  const res = {
    setHeader(name,value){responseHeaders.set(name,String(value));return this;},
    get statusCode(){return statusCode;},
    set statusCode(value){statusCode=value;},
    status(value){statusCode=value;return this;},
    json(value){result = JSON.stringify(value);responseHeaders.set('Content-Type','application/json; charset=utf-8');completed=true;return this;},
    end(value=''){result = value;completed=true;return this;}
  };
  try {
    await handler(req,res);
    if (!completed) return Response.json({error:'No response from handler'}, {status:502});
    return new Response(result,{status:statusCode,headers:responseHeaders});
  } catch (error) {
    console.error('Clue5 Netlify API failed', error);
    return Response.json({error:'Server error'}, {status:500,headers:{'Cache-Control':'no-store'}});
  }
}
