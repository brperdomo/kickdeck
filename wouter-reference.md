# Wouter Reference

Wouter is a tiny router for modern React apps that relies on the HTML5 History API. 

## Key characteristics:
- Query parameters are not considered part of the route matching in Wouter (like most routers)
- The `Route` component only looks at the pathname part of the URL, not the query string

## Important consideration:
When using `Route path="/auth"`, it will match:
- `/auth`
- `/auth?logged_out=true`  
- `/auth?any=query`

The query parameters don't affect route matching. If a 404 is shown when accessing `/auth?logged_out=true`, it's likely that the route isn't defined properly or there's a different issue with how the route is being accessed.